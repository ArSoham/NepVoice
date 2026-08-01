"""
TTS: text -> Nepali audio.

Uses gTTS (Google Translate's TTS engine). It's free with no API key and
supports Nepali ('ne'). Caveats to be upfront about:
- It's an unofficial/free endpoint, not a paid SLA product -- fine for a
  prototype or personal-use deployment, not something to depend on for a
  production app serving many users.
- Voice quality is serviceable, not expressive.
- Requires an internet connection (matches the "backend as internet-
  dependent, app degrades gracefully offline" design already implied by
  the rest of the project).

If/when this needs to run fully offline (mentioned in the original README
for low-connectivity resilience), swap this module for Piper -- but check
Piper's voice list first, since Nepali coverage there is limited/absent as
of this writing.
"""
import os
import uuid
import logging

from gtts import gTTS

from app.config import get_config

logger = logging.getLogger(__name__)
cfg = get_config()


def synthesize(text: str) -> str:
    """Returns the absolute path of the generated mp3 file."""
    if not text.strip():
        raise ValueError("Cannot synthesize empty text")

    filename = f"{uuid.uuid4()}.mp3"
    path = os.path.join(cfg.AUDIO_OUTPUT_DIR, filename)

    tts = gTTS(text=text, lang=cfg.TTS_LANG)
    tts.save(path)
    return path
