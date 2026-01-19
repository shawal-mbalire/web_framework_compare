"""
Feed routes
Timeline generation and infinite scroll
"""

from flask import Blueprint, request, jsonify

bp = Blueprint("feed", __name__)


@bp.route("/", methods=["GET"])
async def get_feed():
    """
    Get user's timeline feed
    Shows posts from followed users
    
    Query params:
        - cursor: Pagination cursor
        - limit: Number of posts (default 20)
    """
    # TODO: Implement
    # 1. Get current user's follows
    # 2. Query posts from followed users (use get_user_feed() function)
    # 3. Implement cursor pagination
    # 4. Compute is_liked, is_retweeted for each post
    # 5. Return FeedResponse
    return jsonify({"posts": [], "has_more": False}), 200


@bp.route("/trending", methods=["GET"])
async def get_trending():
    """
    Get trending posts
    Algorithm: Engagement score over time
    """
    # TODO: Implement
    # 1. Calculate engagement_score = (likes + retweets*2 + replies*3) / hours_since_posted
    # 2. Filter last 24h
    # 3. Sort by score
    # 4. Return TrendingResponse
    return jsonify({"posts": [], "timeframe": "24h"}), 200


@bp.route("/explore", methods=["GET"])
async def explore():
    """
    Explore feed (global timeline)
    Shows recent posts from all users
    """
    # TODO: Implement
    return jsonify({"posts": [], "has_more": False}), 200
