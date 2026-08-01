import os


class Config:
    """
    Config is intentionally free-tier-first:
    - No Postgres, no Celery, no self-hosted model by default.
    - SQLite for history (fine at this scale, zero setup cost on 8GB RAM).
    - Redis is OPTIONAL. If REDIS_URL is unset, the app falls back to an
      in-memory context store (works fine for a single dev instance).
    """

    # --- Gemini (vision + text) ---
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_VISION_MODEL = os.environ.get("GEMINI_VISION_MODEL", "gemini-2.5-flash")
    GEMINI_TEXT_MODEL = os.environ.get("GEMINI_TEXT_MODEL", "gemini-2.5-flash")

    # --- Storage ---
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(os.getcwd(), "vaani.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Redis (optional session/context cache) ---
    REDIS_URL = os.environ.get("REDIS_URL", "")  # empty => use in-memory fallback
    CONTEXT_TTL_SECONDS = int(os.environ.get("CONTEXT_TTL_SECONDS", 60 * 30))  # 30 min

    # --- Audio ---
    AUDIO_OUTPUT_DIR = os.environ.get(
        "AUDIO_OUTPUT_DIR", os.path.join(os.getcwd(), "audio_cache")
    )
    TTS_LANG = os.environ.get("TTS_LANG", "ne")  # Nepali
    WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")  # CPU-friendly
    WHISPER_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "ne")

    # --- Uploads ---
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_UPLOAD_MB", 8)) * 1024 * 1024

    # --- Rate-limit awareness (Gemini free tier: RPM/RPD caps) ---
    # Used only to fail fast with a clear error instead of a confusing 429 trace.
    GEMINI_FREE_TIER_RPM = int(os.environ.get("GEMINI_FREE_TIER_RPM", 10))


class DevConfig(Config):
    DEBUG = True


class ProdConfig(Config):
    DEBUG = False


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    return ProdConfig if env == "production" else DevConfig
