import logging
import os
import tempfile

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.conversation import Conversation
from app.services import gemini_client, tts_service, stt_service, context_store
from app.services.gemini_client import GeminiError

logger = logging.getLogger(__name__)
bp = Blueprint("query", __name__)


@bp.post("/ask")
def ask():
    """
    multipart/form-data:
      session_id: required
      question: text question (optional if 'audio' is provided instead)
      audio: recorded follow-up question audio file (optional if 'question' given)

    application/json (text-only alternative):
      { "session_id": "...", "question": "..." }
    """
    if request.content_type and "multipart/form-data" in request.content_type:
        session_id = request.form.get("session_id")
        question_text = request.form.get("question")
        audio_file = request.files.get("audio")
    else:
        body = request.get_json(silent=True) or {}
        session_id = body.get("session_id")
        question_text = body.get("question")
        audio_file = None

    if not session_id:
        return jsonify({"error": "missing 'session_id'"}), 400
    if not question_text and not audio_file:
        return jsonify({"error": "provide either 'question' or 'audio'"}), 400

    ctx = context_store.get_context(session_id)
    if not ctx:
        return jsonify({
            "error": "no_active_document",
            "message": "No scanned document found for this session (it may have expired). Scan a document first.",
        }), 404

    try:
        if audio_file:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                audio_file.save(tmp.name)
                tmp_path = tmp.name
            try:
                question_text = stt_service.transcribe(tmp_path)
            finally:
                os.unlink(tmp_path)

        if not question_text or not question_text.strip():
            return jsonify({
                "error": "empty_question",
                "message": "Didn't catch a question there — could you try again?",
            }), 422

        answer = gemini_client.answer_followup(
            raw_text=ctx["raw_text"],
            simplified_text=ctx["simplified_text"],
            question=question_text,
            history=ctx.get("history", []),
        )
        audio_path = tts_service.synthesize(answer)

    except GeminiError as e:
        logger.warning("Gemini error during /ask: %s", e)
        return jsonify({"error": "upstream_error", "message": str(e)}), 502
    except Exception as e:  # noqa: BLE001
        logger.exception("Unexpected error during /ask")
        return jsonify({"error": "server_error", "message": str(e)}), 500

    convo = Conversation(
        document_id=ctx.get("document_id"),
        question=question_text,
        answer=answer,
        audio_path=audio_path,
    )
    db.session.add(convo)
    db.session.commit()

    context_store.append_history(session_id, question_text, answer)

    return jsonify(convo.to_dict()), 201
