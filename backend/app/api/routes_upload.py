import logging

from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.document import Document
from app.services import gemini_client, tts_service, context_store
from app.utils.image_preprocess import preprocess_image
from app.services.gemini_client import GeminiError

logger = logging.getLogger(__name__)
bp = Blueprint("upload", __name__)


@bp.post("/scan")
def scan():
    """
    multipart/form-data:
      image: the photographed document (required)
      session_id: client-generated UUID, used to group history + follow-ups (required)
    """
    if "image" not in request.files:
        return jsonify({"error": "missing 'image' file"}), 400

    session_id = request.form.get("session_id")
    if not session_id:
        return jsonify({"error": "missing 'session_id'"}), 400

    raw_bytes = request.files["image"].read()
    if not raw_bytes:
        return jsonify({"error": "empty image"}), 400

    try:
        image_bytes, mime_type = preprocess_image(raw_bytes)

        raw_text = gemini_client.extract_text_from_image(image_bytes, mime_type)
        if not raw_text:
            return jsonify({
                "error": "no_text_detected",
                "message": "Couldn't read any text in that photo. Try moving closer or improving lighting.",
            }), 422

        doc_type = gemini_client.classify_document(raw_text)
        simplified = gemini_client.simplify_text(raw_text, doc_type)

        audio_path = tts_service.synthesize(simplified)

    except GeminiError as e:
        logger.warning("Gemini error during /scan: %s", e)
        return jsonify({"error": "upstream_error", "message": str(e)}), 502
    except Exception as e:  # noqa: BLE001 - surface a clean error to the app
        logger.exception("Unexpected error during /scan")
        return jsonify({"error": "server_error", "message": str(e)}), 500

    doc = Document(
        session_id=session_id,
        doc_type=doc_type,
        raw_text=raw_text,
        simplified_text=simplified,
        audio_path=audio_path,
    )
    db.session.add(doc)
    db.session.commit()

    context_store.set_context(session_id, {
        "document_id": doc.id,
        "raw_text": raw_text,
        "simplified_text": simplified,
        "history": [],
    })

    return jsonify(doc.to_dict()), 201
