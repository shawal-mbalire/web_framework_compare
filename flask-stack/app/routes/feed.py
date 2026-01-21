"""
Feed routes
Timeline generation and pagination
"""

from flask import Blueprint, render_template, request

bp = Blueprint("feed", __name__)


@bp.route("/", methods=["GET"])
def home():
    """
    Home page - user's timeline feed
    Shows posts from followed users
    
    Query params:
        - page: Page number (default 1)
    """
    page = request.args.get("page", 1, type=int)
    
    # TODO: Implement
    # 1. Get current user's follows
    # 2. Query posts from followed users (use get_user_feed() function)
    # 3. Implement pagination
    # 4. Compute is_liked, is_retweeted for each post
    
    # Sample data for now
    posts = [
        {
            "id": "1",
            "author": {"username": "johndoe", "display_name": "John Doe", "avatar": "https://via.placeholder.com/48"},
            "content": "Hello, world! This is my first post using only HTML and CSS.",
            "created_at": "2h ago",
            "likes_count": 42,
            "retweets_count": 8,
            "replies_count": 12,
            "is_liked": False,
            "is_retweeted": False,
        },
        {
            "id": "2",
            "author": {"username": "janedoe", "display_name": "Jane Doe", "avatar": "https://via.placeholder.com/48"},
            "content": "Advanced CSS features like Grid and Container Queries are amazing! No JavaScript needed for responsive layouts.",
            "created_at": "4h ago",
            "likes_count": 89,
            "retweets_count": 23,
            "replies_count": 7,
            "is_liked": True,
            "is_retweeted": False,
        }
    ]
    
    return render_template("pages/home.html", posts=posts, page=page, has_more=True)


@bp.route("/explore", methods=["GET"])
def explore():
    """
    Explore page (global timeline)
    Shows recent posts from all users
    """
    page = request.args.get("page", 1, type=int)
    
    # TODO: Implement
    # Sample data
    posts = []
    
    return render_template("pages/explore.html", posts=posts, page=page)


@bp.route("/trending", methods=["GET"])
def trending():
    """
    Trending page
    Shows trending posts based on engagement score
    """
    # TODO: Implement
    # 1. Calculate engagement_score = (likes + retweets*2 + replies*3) / hours_since_posted
    # 2. Filter last 24h
    # 3. Sort by score
    
    posts = []
    
    return render_template("pages/trending.html", posts=posts, timeframe="24h")


@bp.route("/demo", methods=["GET"])
def demo():
    """
    Demo page showcasing all HTML/CSS features
    """
    return render_template("pages/demo.html")
