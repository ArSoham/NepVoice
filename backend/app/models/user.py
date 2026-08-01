import uuid

from app.extensions import db


class User(db.Model):
    """
    Minimal placeholder. No auth is wired up yet (out of scope for MVP —
    the RN app currently has no login flow either). session_id in
    Document/Conversation is a per-install UUID generated client-side,
    not a real user id.
    """
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = db.Column(db.String(255), unique=True, nullable=True)
