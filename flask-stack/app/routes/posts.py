"""
Posts routes
Create, read, update, delete posts
Handle replies, retweets, and quote tweets
"""

from flask import Blueprint, request, redirect, url_for, flash, render_template

bp = Blueprint("posts", __name__)


@bp.route("/create", methods=["POST"])
def create_post():
    """
    Create a new post
    Handles: Regular posts, Replies, Retweets, Quote Tweets
    """
    content = request.form.get("content", "").strip()
    parent_id = request.form.get("parent_id")
    
    # TODO: Implement
    # 1. Validate content length (1-280 chars)
    # 2. Check if parent_id exists (for replies)
    # 3. Calculate thread_depth and root_post_id
    # 4. Create post in database
    # 5. Trigger notification for parent author (if reply)
    
    if not content or len(content) > 280:
        flash("Post must be between 1 and 280 characters", "error")
        return redirect(url_for("feed.home"))
    
    flash("Post created successfully!", "success")
    return redirect(url_for("feed.home"))


@bp.route("/<post_id>", methods=["GET"])
def view_post(post_id: str):
    """View a single post with its thread"""
    # TODO: Implement
    # 1. Get post from database
    # 2. Check permissions (private accounts)
    # 3. Get thread (replies)
    # 4. Compute is_liked, is_retweeted for current user
    
    post = {
        "id": post_id,
        "author": {"username": "johndoe", "display_name": "John Doe", "avatar": "https://via.placeholder.com/48"},
        "content": "This is a detailed view of a single post.",
        "created_at": "2h ago",
        "likes_count": 42,
        "retweets_count": 8,
        "replies_count": 12,
        "is_liked": False,
        "is_retweeted": False,
    }
    
    replies = []
    
    return render_template("pages/post.html", post=post, replies=replies)


@bp.route("/<post_id>/delete", methods=["POST"])
def delete_post(post_id: str):
    """Delete a post (soft delete)"""
    # TODO: Implement
    # 1. Verify ownership
    # 2. Set is_deleted = True
    # 3. Update denormalized counts
    
    flash("Post deleted", "success")
    return redirect(url_for("feed.home"))


@bp.route("/<post_id>/like", methods=["POST"])
def like_post(post_id: str):
    """Like a post"""
    # TODO: Implement
    # 1. Create Like record (idempotent)
    # 2. Trigger notification
    
    # Redirect back to referring page
    return redirect(request.referrer or url_for("feed.home"))


@bp.route("/<post_id>/unlike", methods=["POST"])
def unlike_post(post_id: str):
    """Unlike a post"""
    # TODO: Implement
    
    return redirect(request.referrer or url_for("feed.home"))


@bp.route("/<post_id>/retweet", methods=["POST"])
def retweet_post(post_id: str):
    """Retweet a post (creates a new post with original_post_id)"""
    # TODO: Implement
    # 1. Create new post with original_post_id, content=NULL
    # 2. Trigger notification
    
    flash("Retweeted!", "success")
    return redirect(request.referrer or url_for("feed.home"))


@bp.route("/<post_id>/unretweet", methods=["POST"])
def unretweet_post(post_id: str):
    """Remove retweet"""
    # TODO: Implement
    
    return redirect(request.referrer or url_for("feed.home"))
