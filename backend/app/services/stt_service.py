"""
STT: user's spoken follow-up -> text.

Uses faster-whisper (CTranslate2 build of OpenAI Whisper) instead of a
cloud STT API, deliberately:
- It's free and fully offline once the model is downloaded once.
- The "small" model (~500MB, int8 quantized) runs on CPU in a few seconds
  for a short follow-up question on this machine's specs (no GPU needed).
  "base" is even lighter/faster if "small" feels slow in practice --
  tune WHISPER_MODEL_SIZE in .env.
- Whisper handles Nepali reasonably (not best-in-class, but no free cloud
  Nepali STT API is dramatically better, and this avoids a second external
  dependency/rate limit on top of Gemini's).

Model loads once per process (kept in a module-level singleton) --
loading it per-request would be slow and wasteful.
"""
import logging
import threading

from faster_whisper import WhisperModel

from app.config import get_config

logger = logging.getLogger(__name__)
cfg = get_config()

_model = None
_model_lock = threading.Lock()


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("Loading faster-whisper model '%s' (first call only)...",
                            cfg.WHISPER_MODEL_SIZE)
                _model = WhisperModel(
                    cfg.WHISPER_MODEL_SIZE, device="cpu", compute_type="int8"
                )
    return _model


def transcribe(audio_path: str) -> str:
    model = _get_model()
    segments, _info = model.transcribe(
        audio_path, language=cfg.WHISPER_LANGUAGE, beam_size=1
    )
    return " ".join(seg.text.strip() for seg in segments).strip()
