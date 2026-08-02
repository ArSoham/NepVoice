import os

from flask import Blueprint, send_file, jsonify

from app.models.document import Document
from app.models.conversation import Conversation
from app.services import context_store

bp = Blueprint("tts", __name__)


@bp.get("/audio/insights/<session_id>")
def get_insights_audio(session_id):
    cached = context_store.get_context(f"insights:{session_id}")
    audio_path = cached.get("audio_path") if cached else None
    if not audio_path or not os.path.exists(audio_path):
        return jsonify({"error": "audio not found"}), 404
    return send_file(audio_path, mimetype="audio/mpeg")


@bp.get("/audio/<kind>/<record_id>")
def get_audio(kind, record_id):
    if kind == "doc":
        record = Document.query.get(record_id)
    elif kind == "answer":
        record = Conversation.query.get(record_id)
    else:
        return jsonify({"error": "kind must be 'doc' or 'answer'"}), 400

    if not record or not record.audio_path or not os.path.exists(record.audio_path):
        return jsonify({"error": "audio not found"}), 404

    return send_file(record.audio_path, mimetype="audio/mpeg")


# Backward-compatible shorthand matching the original README's /api/audio/<id>
# (assumes a document id — most callers will use /api/audio/doc/<id> instead)
@bp.get("/audio/<record_id>")
def get_audio_doc_shorthand(record_id):
    return get_audio("doc", record_id)
