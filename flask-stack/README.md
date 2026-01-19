# Flask Stack (2026 Edition) - Social Architecture Audit

Professional Twitter/X clone using Flask 3.1+, SQLAlchemy 2.0 (async), Pydantic v2, HTMx, and Alpine.js with bleeding-edge 2026 features.

## 🚀 2026 Tech Stack

- **Backend**: Flask 3.1+ (Async rendering, Streaming responses)
- **Package Manager**: uv (Rust-powered, 10-100x faster than pip)
- **ORM**: SQLAlchemy 2.0 (Async with asyncpg)
- **Validation**: Pydantic v2
- **Database**: PostgreSQL 15+
- **Cache/Queue**: Redis with hiredis
- **Task Queue**: Celery
- **Frontend**: HTMx 2.0 + Alpine.js 3.x
- **Linting**: Ruff (Rust-based, replaces Black + isort + flake8)
- **Auth**: JWT with refresh tokens

## ✨ 2026 Bleeding-Edge Features

### 1. Async Jinja2 Rendering
```python
@bp.route("/feed")
async def feed():
    # Fetch from multiple sources concurrently
    posts, trending, notifications = await asyncio.gather(
        get_feed_posts(),
        get_trending(),
        get_notifications()
    )
    return await render_template_async('feed.html', 
        posts=posts, 
        trending=trending,
        notifications=notifications
    )
```

### 2. Streaming Responses (AI/LLM Integration)
```python
@bp.route("/ai/generate")
async def generate_post():
    async def stream_ai_response():
        async for chunk in ai_model.generate_stream(prompt):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
    
    return Response(stream_ai_response(), mimetype="text/event-stream")
```

### 3. First-Class HTMx Patterns
```python
from flask_htmx import HTMX

htmx = HTMX(app)

@bp.route("/posts", methods=["POST"])
@htmx.trigger("newPost")  # Auto-trigger HTMx event
async def create_post():
    post = await save_post()
    return render_template("partials/post_card.html", post=post)
```

## Architecture

### Backend (Flask)
- **Type-Safe Models**: SQLAlchemy 2.0 `Mapped` annotations
- **Request/Response Validation**: Pydantic v2 schemas
- **Async Database**: SQLAlchemy AsyncEngine with asyncpg
- **Session Management**: JWT tokens with Redis backing

### Frontend (HTMx + Alpine.js)
- **Hypermedia Driven**: HTMx handles AJAX, CSS transitions, WebSockets
- **Reactive UI**: Alpine.js for client-side state (optimistic updates)
- **No Build Step**: Direct CDN includes for rapid development
- **SSE**: Server-Sent Events for real-time notifications

## Setup

### Prerequisites
```bash
# PostgreSQL 15+
sudo apt install postgresql-15

# Redis
sudo apt install redis-server

# Python 3.11+
sudo apt install python3.11 python3.11-venv
```

### Installation

1. **Install dependencies with uv**:
```bash
cd flask-stack

# Create virtual environment
uv venv

# Activate
source .venv/bin/activate

# Install dependencies (lightning fast!)
uv pip install -e ".[dev]"
```

3. **Setup database**:
```bash
# Create database
createdb social_audit

# Run schema
psql social_audit < ../schema.sql
```

4. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Run migrations** (if using Alembic):
```bash
alembic upgrade head
```

### Running

**Development server**:
```bash
flask --app app run --debug
```

**Production server (Gunicorn)**:
```bash
gunicorn -w 4 -k gevent -b 0.0.0.0:5000 "app:create_app()"
```

**Celery worker** (for background tasks):
```bash
celery -A app.celery worker --loglevel=info
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Posts
- `POST /api/posts` - Create post/reply/retweet
- `GET /api/posts/<id>` - Get single post
- `GET /api/posts/<id>/thread` - Get threaded conversation
- `DELETE /api/posts/<id>` - Delete post
- `POST /api/posts/<id>/like` - Like post
- `POST /api/posts/<id>/unlike` - Unlike post
- `POST /api/posts/<id>/retweet` - Retweet
- `POST /api/posts/<id>/unretweet` - Remove retweet

### Feed
- `GET /api/feed` - Get personalized timeline
- `GET /api/feed/trending` - Get trending posts
- `GET /api/feed/explore` - Global timeline

### Users
- `GET /api/users/<username>` - Get profile
- `GET /api/users/<username>/posts` - Get user's posts
- `POST /api/users/<username>/follow` - Follow user
- `POST /api/users/<username>/unfollow` - Unfollow
- `GET /api/users/<username>/followers` - Get followers
- `GET /api/users/<username>/following` - Get following

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/stream` - SSE stream
- `POST /api/notifications/<id>/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all read

## Key Features

### 1. Threaded Conversations
Uses `parent_id` self-reference with recursive CTEs:
```sql
SELECT * FROM get_thread('post-uuid');
```

### 2. Retweets & Quote Tweets
- **Retweet**: `original_post_id` set, `content` NULL
- **Quote Tweet**: `original_post_id` set, `content` NOT NULL

### 3. Optimistic UI
HTMx + Alpine.js enable instant UI updates:
```html
<button @click="liked = !liked; likes += liked ? 1 : -1">
```

### 4. Real-Time Notifications
Server-Sent Events (SSE) for push notifications:
```javascript
const source = new EventSource('/api/notifications/stream');
```

### 5. Denormalized Counts
Triggers maintain `likes_count`, `followers_count`, etc. for performance.

## Performance Optimizations

1. **Indexed Queries**: Composite indexes on `(user_id, created_at)`
2. **Connection Pooling**: SQLAlchemy pool_size=20
3. **Redis Caching**: Session storage, feed caching
4. **Async DB**: Non-blocking I/O with asyncpg
5. **Partial Indexes**: WHERE clauses reduce index size

## Type Safety

### Backend
- **Models**: 100% typed with `Mapped[T]`
- **Schemas**: Pydantic v2 validation
- **Routes**: Type hints on all functions
- **MyPy**: Strict mode enforced

### Frontend
- **HTMx**: Type-safe via HTML attributes
- **Alpine.js**: Runtime typing (TypeScript alternative)

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

## Development Tools

- **Black**: Code formatting
- **Ruff**: Linting
- **MyPy**: Type checking
- **pytest**: Testing

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup with:
- Nginx reverse proxy
- Gunicorn + Gevent workers
- PostgreSQL read replicas
- Redis cluster
- Celery for background jobs

## Benchmark Metrics

Track in [../ANALYTICS.md](../ANALYTICS.md):
- Bundle size: ~0 KB (HTMx + Alpine from CDN)
- TBT: Measured on infinite scroll
- Type-safety leakage: Minimal with SQLAlchemy 2.0 + Pydantic v2
