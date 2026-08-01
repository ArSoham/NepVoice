import uuid
import datetime as dt

from app.extensions import db


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = db.Column(db.String(36), db.ForeignKey("documents.id"), index=True)
    question = db.Column(db.Text, default="")
    answer = db.Column(db.Text, default="")
    audio_path = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=dt.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "question": self.question,
            "answer": self.answer,
            "audio_url": f"/api/audio/answer/{self.id}" if self.audio_path else None,
            "created_at": self.created_at.isoformat(),
        }
