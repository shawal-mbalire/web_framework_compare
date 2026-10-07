import re

from flask.testing import FlaskClient


def test_health(client: FlaskClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_anonymous_home_is_landing_page(client: FlaskClient) -> None:
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Welcome to Social Audit" in resp.data


def test_unknown_route_renders_404(client: FlaskClient) -> None:
    resp = client.get("/definitely-not-a-page")
    assert resp.status_code == 404
    assert b"Page Not Found" in resp.data


def test_login_and_register_pages_render(client: FlaskClient) -> None:
    assert client.get("/auth/login").status_code == 200
    assert client.get("/auth/register").status_code == 200


def test_protected_routes_redirect_to_login(client: FlaskClient) -> None:
    resp = client.post("/posts/create", data={"content": "hi"})
    assert resp.status_code == 302
    assert "/auth/login" in resp.headers["Location"]


def test_register_rejects_mismatched_passwords(client: FlaskClient) -> None:
    resp = client.post(
        "/auth/register",
        data={
            "username": "someone",
            "email": "someone@example.com",
            "password": "password123",
            "password_confirm": "different123",
        },
        follow_redirects=True,
    )
    assert b"Passwords do not match" in resp.data


def test_login_rejects_open_redirect(client: FlaskClient, new_user: dict[str, str]) -> None:
    client.post("/auth/logout")
    resp = client.post(
        "/auth/login?next=//evil.example.com",
        data={"username": new_user["username"], "password": new_user["password"]},
    )
    assert resp.status_code == 302
    assert resp.headers["Location"] == "/"


def test_seed_user_can_log_in(client: FlaskClient, requires_db: None) -> None:
    resp = client.post(
        "/auth/login", data={"username": "alice", "password": "password123"}, follow_redirects=True
    )
    assert b"Login successful" in resp.data


def test_post_like_retweet_reply_and_delete(client: FlaskClient, new_user: dict[str, str]) -> None:
    resp = client.post(
        "/posts/create",
        data={"content": "Hello from the test suite #pytest"},
        follow_redirects=True,
    )
    assert b"Post created" in resp.data

    profile = client.get(f"/users/{new_user['username']}")
    assert b"Hello from the test suite" in profile.data
    match = re.search(rb'id="post-([0-9a-f-]{36})"', profile.data)
    assert match
    post_id = match.group(1).decode()

    # Like (twice: idempotent) then unlike
    client.post(f"/posts/{post_id}/like")
    client.post(f"/posts/{post_id}/like")
    page = client.get(f"/posts/{post_id}").data.decode()
    assert "action-liked" in page
    client.post(f"/posts/{post_id}/unlike")
    assert "action-liked" not in client.get(f"/posts/{post_id}").data.decode()

    # Retweet shows up with the retweeted state
    client.post(f"/posts/{post_id}/retweet")
    assert "action-retweeted" in client.get(f"/posts/{post_id}").data.decode()
    client.post(f"/posts/{post_id}/unretweet")
    assert "action-retweeted" not in client.get(f"/posts/{post_id}").data.decode()

    # Reply lands on the thread page
    client.post("/posts/create", data={"content": "A reply", "parent_id": post_id})
    assert b"A reply" in client.get(f"/posts/{post_id}").data

    # Full-text search finds it
    assert b"Hello from the test suite" in client.get("/search?q=pytest").data

    # Delete hides it
    client.post(f"/posts/{post_id}/delete")
    assert client.get(f"/posts/{post_id}").status_code == 404


def test_cannot_delete_someone_elses_post(client: FlaskClient, new_user: dict[str, str]) -> None:
    explore = client.get("/explore").data
    match = re.search(rb'id="post-([0-9a-f-]{36})"', explore)
    assert match, "seed data should provide posts"
    assert client.post(f"/posts/{match.group(1).decode()}/delete").status_code == 403


def test_follow_and_notifications(client: FlaskClient, new_user: dict[str, str]) -> None:
    client.post("/users/alice/follow")
    assert b"Unfollow" in client.get("/users/alice").data
    home = client.get("/").data
    assert b"Comparing four stacks" in home  # alice's post is now in the home feed
    client.post("/users/alice/unfollow")
    assert b"Unfollow" not in client.get("/users/alice").data

    assert client.get("/notifications/").status_code == 200
    assert client.post("/notifications/read-all").status_code == 302


def test_explore_and_trending_render(client: FlaskClient, requires_db: None) -> None:
    assert client.get("/explore").status_code == 200
    assert client.get("/trending").status_code == 200
    assert client.get("/users/nobody_by_this_name").status_code == 404
