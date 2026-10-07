"""
Notifications routes
Notification list, read state, and an SSE stream of the unread count
"""

import json
import time
from collections.abc import Iterator
from uuid import UUID

from flask import Blueprint, Response, redirect, render_template, stream_with_context, url_for
from sqlalchemy import func, select, update
from werkzeug.wrappers import Response as BaseResponse

from app.auth import current_user_id, login_required
from app.database import get_db
from app.models import Notification

bp = Blueprint("notifications", __name__)

STREAM_INTERVAL_SECONDS = 15
# Close the stream periodically so a worker thread is never held forever;
# EventSource reconnects automatically.
STREAM_MAX_SECONDS = 300


def _unread_count(user_id: UUID) -> int:
    return (
        get_db().scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        )
        or 0
    )


@bp.route("/", methods=["GET"])
@login_required
def list_notifications() -> str:
    """The current user's 50 most recent notifications"""
    notifications = get_db().scalars(
        select(Notification)
        .where(Notification.user_id == current_user_id())
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return render_template("pages/notifications.html", notifications=list(notifications))


@bp.route("/<uuid:notification_id>/read", methods=["POST"])
@login_required
def mark_read(notification_id: UUID) -> BaseResponse:
    """Mark a notification as read"""
    db = get_db()
    db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user_id())
        .values(is_read=True, read_at=func.now())
    )
    db.commit()
    return redirect(url_for("notifications.list_notifications"))


@bp.route("/read-all", methods=["POST"])
@login_required
def mark_all_read() -> BaseResponse:
    """Mark all notifications as read"""
    db = get_db()
    db.execute(
        update(Notification)
        .where(Notification.user_id == current_user_id(), Notification.is_read.is_(False))
        .values(is_read=True, read_at=func.now())
    )
    db.commit()
    return redirect(url_for("notifications.list_notifications"))


@bp.route("/stream", methods=["GET"])
@login_required
def notification_stream() -> Response:
    """Server-Sent Events: pushes ``{"unread_count": n}`` whenever it changes."""
    user_id = current_user_id()
    assert user_id is not None

    def generate() -> Iterator[str]:
        last: int | None = None
        deadline = time.monotonic() + STREAM_MAX_SECONDS
        while time.monotonic() < deadline:
            count = _unread_count(user_id)
            get_db().rollback()  # end the read transaction between polls
            if count != last:
                last = count
                yield f"event: unread\ndata: {json.dumps({'unread_count': count})}\n\n"
            else:
                yield ": heartbeat\n\n"
            time.sleep(STREAM_INTERVAL_SECONDS)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
