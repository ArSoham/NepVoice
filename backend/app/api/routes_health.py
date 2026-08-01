from flask import Blueprint, jsonify

from app.config import get_config

bp = Blueprint("health", __name__)
cfg = get_config()


@bp.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "gemini_key_configured": bool(cfg.GEMINI_API_KEY),
        }
    )
