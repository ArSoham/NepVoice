import logging

from flask import Blueprint, request, jsonify

from app.models.document import Document
from app.services import gemini_client, tts_service, context_store
from app.services.gemini_client import GeminiError

logger = logging.getLogger(__name__)
bp = Blueprint("insights", __name__)

# Only the most recent N documents feed the overview prompt — keeps the
# request small (and cheap) regardless of how long someone's history gets.
MAX_DOCS_IN_OVERVIEW = 15


@bp.get("/insights")
def insights():
    """
    Aggregated 'everything you've scanned' view for a session:
    - counts per document type
    - one short spoken-Nepali AI overview (cached; only regenerated when the
      document set actually changes, so re-opening the tab costs 0 tokens)
    """
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "missing 'session_id' query param"}), 400

    docs = (
        Document.query.filter_by(session_id=session_id)
        .order_by(Document.created_at.desc())
        .all()
    )

    if not docs:
        return jsonify({"total": 0, "by_type": {}, "overview": None, "audio_url": None})

    by_type: dict[str, int] = {}
    for d in docs:
        by_type[d.doc_type] = by_type.get(d.doc_type, 0) + 1

    cache_key = f"insights:{session_id}"
    latest_id = docs[0].id
    cached = context_store.get_context(cache_key)

    if cached and cached.get("doc_count") == len(docs) and cached.get("latest_id") == latest_id:
        return jsonify({
            "total": len(docs),
            "by_type": by_type,
            "overview": cached.get("overview"),
            "audio_url": f"/api/audio/insights/{session_id}" if cached.get("has_audio") else None,
        })

    try:
        doc_entries = [(d.doc_type, d.simplified_text) for d in docs[:MAX_DOCS_IN_OVERVIEW]]
        overview = gemini_client.summarize_all(doc_entries)
        audio_path = tts_service.synthesize(overview) if overview else None
    except GeminiError as e:
        logger.warning("Gemini error during /insights: %s", e)
        return jsonify({"error": "upstream_error", "message": str(e)}), 502
    except Exception as e:  # noqa: BLE001
        logger.exception("Unexpected error during /insights")
        return jsonify({"error": "server_error", "message": str(e)}), 500

    context_store.set_context(cache_key, {
        "doc_count": len(docs),
        "latest_id": latest_id,
        "overview": overview,
        "audio_path": audio_path,
        "has_audio": bool(audio_path),
    })

    return jsonify({
        "total": len(docs),
        "by_type": by_type,
        "overview": overview,
        "audio_url": f"/api/audio/insights/{session_id}" if audio_path else None,
    })
