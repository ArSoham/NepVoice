import os

_DIR = os.path.dirname(__file__)

_DEFAULT = """Rewrite the following document text as plain, warm, conversational
spoken Nepali for someone who cannot read it themselves. Keep it under 4
short sentences. Do not use bullet points, headings, or written-register
phrasing -- write it exactly as you would say it out loud.

Document text:
{raw_text}
"""

_FILENAMES = {
    "medicine_label": "simplify_medicine.txt",
    "government_notice": "simplify_notice.txt",
    "bus_ticket": "simplify_ticket.txt",
    "receipt": "simplify_receipt.txt",
    "agricultural_instructions": "simplify_agriculture.txt",
    "handwritten_note": "simplify_handwritten.txt",
}

_cache = {}


def load_prompt(doc_type: str) -> str:
    if doc_type in _cache:
        return _cache[doc_type]

    filename = _FILENAMES.get(doc_type)
    if filename:
        path = os.path.join(_DIR, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                _cache[doc_type] = f.read()
                return _cache[doc_type]

    _cache[doc_type] = _DEFAULT
    return _DEFAULT
