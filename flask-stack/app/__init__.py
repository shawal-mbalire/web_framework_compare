"""
Flask application factory
"""

from flask import Flask
from flask_cors import CORS
from app.config import settings


def create_app() -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["DEBUG"] = settings.FLASK_DEBUG
    
    # CORS
    CORS(app, origins=settings.CORS_ORIGINS)
    
    # Register blueprints
    from app.routes import auth, posts, users, feed, notifications
    
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(posts.bp, url_prefix="/api/posts")
    app.register_blueprint(users.bp, url_prefix="/api/users")
    app.register_blueprint(feed.bp, url_prefix="/api/feed")
    app.register_blueprint(notifications.bp, url_prefix="/api/notifications")
    
    # Health check
    @app.route("/health")
    def health():
        return {"status": "ok"}
    
    return app
