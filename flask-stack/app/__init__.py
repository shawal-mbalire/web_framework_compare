"""
Flask application factory
"""

from typing import Any

from flask import Flask, render_template
from werkzeug.exceptions import HTTPException

from app import database
from app.config import settings


def create_app(config: dict[str, Any] | None = None) -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__)

    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["DEBUG"] = settings.FLASK_DEBUG
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # blocks cross-site form POSTs (CSRF)
    app.config["SESSION_COOKIE_SECURE"] = settings.SESSION_COOKIE_SECURE
    if config:
        app.config.update(config)

    database.init_app(app)

    from app.routes import auth, feed, notifications, posts, users

    app.register_blueprint(feed.bp)
    app.register_blueprint(auth.bp, url_prefix="/auth")
    app.register_blueprint(posts.bp, url_prefix="/posts")
    app.register_blueprint(users.bp, url_prefix="/users")
    app.register_blueprint(notifications.bp, url_prefix="/notifications")

    @app.route("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.errorhandler(404)
    def not_found(e: HTTPException) -> tuple[str, int]:
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(e: Exception) -> tuple[str, int]:
        return render_template("errors/500.html"), 500

    return app
