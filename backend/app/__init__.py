import os
import logging

from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    os.makedirs(app.config["AUDIO_OUTPUT_DIR"], exist_ok=True)

    CORS(app)  # RN app calls this from a different origin/port
    db.init_app(app)

    logging.basicConfig(level=logging.INFO)

    with app.app_context():
        from app.models import document, conversation  # noqa: F401
        db.create_all()

    from app.api.routes_health import bp as health_bp
    from app.api.routes_upload import bp as upload_bp
    from app.api.routes_query import bp as query_bp
    from app.api.routes_tts import bp as tts_bp
    from app.api.routes_history import bp as history_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(query_bp, url_prefix="/api")
    app.register_blueprint(tts_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")

    return app
