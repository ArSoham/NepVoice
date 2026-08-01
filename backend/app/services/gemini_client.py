"""
Gemini client wrapper.

WHY Gemini instead of self-hosting Gemma, and why not HF Inference API:
- This laptop (i7-1165G7, 8GB RAM, integrated Iris Xe, no dedicated GPU/VRAM)
  cannot run a vision-capable Gemma model locally with usable latency or
  quality. There is no CUDA device, and 8GB total RAM has to cover the OS,
  Docker, Redis, Postgres/SQLite, and the model itself.
- HF's free Serverless Inference API is rate-limited to a few hundred
  requests/hour and mostly reliable for small text-only models; vision
  models are frequently gated, oversized for free serverless, or cold-start
  slowly. It's not a good fit for a live "snap -> speech" flow.
- Google AI Studio's Gemini API has a genuinely free, permanent tier that
  supports multimodal (image) input directly, which is exactly what
  vision_service needs. Gemma (text) is also available for free through
  the same API/AI Studio if you want to swap it in for the text-only
  simplification step.

Get a free key at https://aistudio.google.com/apikey (Google account,
no credit card required for the free tier as of this writing).

Free tier is roughly (subject to change, check AI Studio dashboard):
  gemini-2.5-flash: ~10-15 requests/minute, ~250 requests/day
This is enough for personal use / demoing, NOT for many concurrent users.
"""
import base64
import logging
import time

import requests

from app.config import get_config

logger = logging.getLogger(__name__)
cfg = get_config()

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiError(Exception):
    pass


def _post(model: str, payload: dict, retries: int = 2):
    if not cfg.GEMINI_API_KEY:
        raise GeminiError(
            "GEMINI_API_KEY is not set. Get a free key at "
            "https://aistudio.google.com/apikey and put it in backend/.env"
        )

    url = f"{GEMINI_BASE}/{model}:generateContent?key={cfg.GEMINI_API_KEY}"
    last_err = None
    for attempt in range(retries + 1):
        resp = requests.post(url, json=payload, timeout=60)
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 429:
            # Free-tier rate limit hit. Back off once, then surface a clear error
            # rather than a raw stack trace — the RN app should show
            # "too many requests, try again in a moment" using this message.
            last_err = "rate_limited"
            time.sleep(2 * (attempt + 1))
            continue
        raise GeminiError(f"Gemini API error {resp.status_code}: {resp.text[:300]}")

    raise GeminiError(
        "Gemini free-tier rate limit reached. Wait a minute and try again."
    )


def _extract_text(response_json: dict) -> str:
    try:
        candidates = response_json.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts).strip()
    except (KeyError, IndexError, TypeError):
        return ""


def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Vision step: OCR + layout-aware raw text extraction from a photographed document."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    prompt = (
        "You are an OCR engine. Read every piece of visible text in this image "
        "exactly as printed (Nepali Devanagari, English, or numerals). "
        "Preserve reading order. Do not translate, summarize, or explain. "
        "Output only the raw extracted text."
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": b64}},
                ]
            }
        ],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 1024},
    }
    result = _post(cfg.GEMINI_VISION_MODEL, payload)
    return _extract_text(result)


def classify_document(raw_text: str) -> str:
    """Cheap classification so the simplifier can use a doc-type-aware prompt."""
    prompt = (
        "Classify this extracted document text into exactly one label: "
        "medicine_label, government_notice, bus_ticket, receipt, "
        "agricultural_instructions, handwritten_note, or other. "
        "Respond with only the label, nothing else.\n\nText:\n" + raw_text[:2000]
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 20},
    }
    result = _post(cfg.GEMINI_TEXT_MODEL, payload)
    label = _extract_text(result).strip().lower()
    valid = {
        "medicine_label", "government_notice", "bus_ticket", "receipt",
        "agricultural_instructions", "handwritten_note", "other",
    }
    return label if label in valid else "other"


def simplify_text(raw_text: str, doc_type: str) -> str:
    """Rewrite dense/official text into plain, spoken, conversational Nepali."""
    from app.prompts import load_prompt

    template = load_prompt(doc_type)
    prompt = template.format(raw_text=raw_text)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
    }
    result = _post(cfg.GEMINI_TEXT_MODEL, payload)
    return _extract_text(result)


def answer_followup(raw_text: str, simplified_text: str, question: str, history: list) -> str:
    """Grounded follow-up Q&A using the original extracted text as context."""
    history_str = "\n".join(f"Q: {h['question']}\nA: {h['answer']}" for h in history[-5:])
    prompt = (
        "You are a helpful voice assistant speaking plain conversational Nepali "
        "to a low-literacy or visually impaired user. Answer the user's question "
        "using ONLY the document context below. If the answer isn't in the "
        "document, say so plainly and don't guess.\n\n"
        f"Original document text:\n{raw_text}\n\n"
        f"Simplified summary already given to the user:\n{simplified_text}\n\n"
        f"Previous follow-up Q&A this session:\n{history_str}\n\n"
        f"New question: {question}\n\n"
        "Answer in 1-3 short spoken sentences in Nepali."
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 256},
    }
    result = _post(cfg.GEMINI_TEXT_MODEL, payload)
    return _extract_text(result)
