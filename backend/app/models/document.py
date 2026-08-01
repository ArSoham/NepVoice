import uuid
import datetime as dt

from app.extensions import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(36), index=True, nullable=False)
    doc_type = db.Column(db.String(64), default="unknown")
    raw_text = db.Column(db.Text, default="")
    simplified_text = db.Column(db.Text, default="")
    audio_path = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "doc_type": self.doc_type,
            "summary": self.simplified_text,
            "audio_url": f"/api/audio/{self.id}" if self.audio_path else None,
            "created_at": self.created_at.isoformat(),
        }
