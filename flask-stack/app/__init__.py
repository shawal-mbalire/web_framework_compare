"""
Flask application factory
"""

from flask import Flask, render_template
from app.config import settings


def create_app() -> Flask:
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["DEBUG"] = settings.FLASK_DEBUG
    
    # Register blueprints
    from app.routes import auth, posts, users, feed, notifications
    
    # Page routes (render HTML)
    app.register_blueprint(feed.bp, url_prefix="")
    app.register_blueprint(auth.bp, url_prefix="/auth")
    app.register_blueprint(posts.bp, url_prefix="/posts")
    app.register_blueprint(users.bp, url_prefix="/users")
    app.register_blueprint(notifications.bp, url_prefix="/notifications")
    
    # Health check
    @app.route("/health")
    def health():
        return {"status": "ok"}
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template("errors/500.html"), 500
    
    return app
