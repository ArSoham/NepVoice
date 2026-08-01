from flask import Blueprint, request, jsonify

from app.models.document import Document
from app.models.conversation import Conversation

bp = Blueprint("history", __name__)


@bp.get("/history")
def history():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "missing 'session_id' query param"}), 400

    docs = (
        Document.query.filter_by(session_id=session_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return jsonify([d.to_dict() for d in docs])


@bp.get("/history/<document_id>/conversation")
def conversation_history(document_id):
    convos = (
        Conversation.query.filter_by(document_id=document_id)
        .order_by(Conversation.created_at.asc())
        .all()
    )
    return jsonify([c.to_dict() for c in convos])
