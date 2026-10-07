"""
Feed routes
Timeline generation, explore, trending and search
"""

from flask import Blueprint, render_template, request

from app.auth import current_user, current_user_id
from app.config import settings
from app.services import posts as post_service

bp = Blueprint("feed", __name__)


@bp.route("/", methods=["GET"])
def home() -> str:
    """
    Home page - the user's timeline (own posts + followed users).
    Anonymous visitors get the landing page.

    Query params:
        - page: Page number (default 1)
    """
    user = current_user()
    if user is None:
        return render_template("index.html")

    page = request.args.get("page", 1, type=int)
    result = post_service.home_feed(user.id, page, settings.PAGE_SIZE)
    return render_template(
        "pages/home.html",
        posts=result.posts,
        page=result.page,
        has_more=result.has_more,
        suggestions=post_service.suggested_users(user.id),
    )


@bp.route("/explore", methods=["GET"])
def explore() -> str:
    """Explore page (global timeline of recent top-level posts)"""
    page = request.args.get("page", 1, type=int)
    result = post_service.explore_feed(page, settings.PAGE_SIZE, current_user_id())
    return render_template(
        "pages/explore.html",
        posts=result.posts,
        page=result.page,
        has_more=result.has_more,
        q="",
        page_endpoint="feed.explore",
    )


@bp.route("/search", methods=["GET"])
def search() -> str:
    """Full-text search over post content (uses the GIN index from schema.sql)"""
    q = request.args.get("q", "").strip()
    page = request.args.get("page", 1, type=int)
    if q:
        result = post_service.search_posts(q, page, settings.PAGE_SIZE, current_user_id())
        posts, page, has_more = result.posts, result.page, result.has_more
    else:
        posts, page, has_more = [], 1, False
    return render_template(
        "pages/explore.html",
        posts=posts,
        page=page,
        has_more=has_more,
        q=q,
        page_endpoint="feed.search",
    )


@bp.route("/trending", methods=["GET"])
def trending() -> str:
    """Trending posts in the last 24h ranked by engagement score"""
    posts = post_service.trending_posts(settings.PAGE_SIZE, current_user_id())
    return render_template("pages/trending.html", posts=posts, timeframe="24h")


@bp.route("/demo", methods=["GET"])
def demo() -> str:
    """Demo page showcasing all HTML/CSS features"""
    return render_template("pages/demo.html")
