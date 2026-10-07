# Flask Stack

Server-rendered Twitter/X clone: **Flask 3.1**, **SQLAlchemy 2.1** (typed ORM, psycopg 3),
**Pydantic v2** for input validation, and plain HTML forms + modern CSS on the front end.
There is no front-end framework or build step; the only JavaScript is a handful of
one-line inline handlers (opening `<dialog>`s, character counters).

## What works

| Feature | Route |
|---|---|
| Register / login / logout (bcrypt, cookie session) | `/auth/register`, `/auth/login`, `/auth/logout` |
| Home timeline (own + followed users, paginated) | `/` |
| Explore (global timeline) | `/explore` |
| Full-text search (uses the GIN index from `schema.sql`) | `/search?q=...` |
| Trending (last 24h by engagement score) | `/trending` |
| Create post / reply (thread depth + root tracking) | `POST /posts/create` |
| Post detail with replies | `/posts/<id>` |
| Like / unlike, retweet / unretweet (idempotent) | `POST /posts/<id>/like` etc. |
| Soft delete (owner only) | `POST /posts/<id>/delete` |
| Profiles, follow / unfollow | `/users/<username>` |
| Followers / following (JSON) | `/users/<username>/followers` |
| Notifications (like, reply, retweet, follow) | `/notifications/` |
| Unread-count SSE stream | `/notifications/stream` |

Every mutation is a regular form `POST` followed by a redirect (Post/Redirect/Get), so the
whole app works with JavaScript disabled. CSRF is mitigated by `SameSite=Lax` session cookies.

## Layout

```
app/
├── __init__.py        # create_app() factory
├── auth.py            # password hashing, current_user(), @login_required
├── config.py          # pydantic-settings (env / .env)
├── database.py        # lazy engine + request-scoped Session
├── models/            # SQLAlchemy mappings of ../schema.sql
├── schemas/           # Pydantic models (registration validation, API shapes)
├── services/posts.py  # feed queries + post serialization
├── routes/            # blueprints: feed, auth, posts, users, notifications
├── templates/         # Jinja2 pages and components
└── static/css/        # single stylesheet (grid, :has(), container queries, <dialog>)
```

`../schema.sql` is the source of truth for tables, indexes and the triggers that maintain
denormalized counts; the app never calls `create_all`.

## Running locally

```bash
# Database (from the repo root)
createdb social_audit && psql social_audit < ../schema.sql

cd flask-stack
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env          # adjust DATABASE_URL
flask --app app run --debug   # http://localhost:5000
```

Seed accounts: `alice`, `bob`, `carol`, `dave`, `erin` — password `password123`.

## Quality checks

```bash
ruff check app tests
ruff format --check app tests
mypy app            # strict mode, configured in pyproject.toml
pytest              # DB tests are skipped if DATABASE_URL isn't reachable
```

## Further reading

- [REACTIVE_PATTERNS.md](REACTIVE_PATTERNS.md) – the dialog + redirect interaction model
- [ADVANCED_CSS_FEATURES.md](ADVANCED_CSS_FEATURES.md) – CSS techniques used instead of JS
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md), [README_DIALOGS.md](README_DIALOGS.md), [TESTING.md](TESTING.md)
