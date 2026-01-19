# Docker Compose Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            YOUR BROWSER                                  │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Traefik Reverse Proxy (Port 80 + Dashboard on 8080)                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Routing Rules:                                                  │    │
│  │  • flask.localhost     → Flask Container                         │    │
│  │  • astro.localhost     → Astro Container                         │    │
│  │  • tanstack.localhost  → TanStack Container                      │    │
│  │  • angular.localhost   → Angular Container                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───┬──────┬──────┬──────┬──────────────────────────────────────────────┘
    │      │      │      │
    │      │      │      │
    ▼      ▼      ▼      ▼
┌───────┬───────┬───────┬───────┐
│Flask  │Astro  │TanStk │Angular│  ← Application Containers
│:5000  │:4321  │:3000  │:4200  │
│       │       │       │       │
│Python │TS+SSR │React  │Angular│
│+HTMx  │+Svelt │+TSStk │+Signals│
└───┬───┴───┬───┴───┬───┴───┬───┘
    │       │       │       │
    │       │       │       │
    └───────┴───────┴───────┘
            │
            ▼
    ┌───────────────┐
    │  PostgreSQL   │  ← Shared Database
    │    :5432      │
    │               │
    │ social_audit  │
    │ (DB name)     │
    └───────────────┘
            │
            ▼
    ┌───────────────┐
    │     Redis     │  ← Cache (Flask only)
    │    :6379      │
    │               │
    │ Sessions +    │
    │ Celery Tasks  │
    └───────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Docker Network: social-audit-network                                    │
│  All containers can communicate using service names                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Docker Volume: postgres_data                                            │
│  Persists database data across container restarts                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### User visits http://flask.localhost/feed

```
1. Browser → Traefik
   GET http://flask.localhost/feed

2. Traefik → Flask Container
   Routes to Flask based on hostname rule
   Host(`flask.localhost`)

3. Flask Container → PostgreSQL
   SELECT * FROM posts WHERE ...
   JOIN users ON posts.user_id = users.id
   ORDER BY created_at DESC LIMIT 20

4. PostgreSQL → Flask Container
   Returns 20 posts with user data

5. Flask Container → Browser
   Renders Jinja2 template with HTMx
   Server-side rendered HTML

6. Browser displays feed
   HTMx handles infinite scroll
   Alpine.js handles like button
```

### User visits http://astro.localhost/feed

```
1. Browser → Traefik
   GET http://astro.localhost/feed

2. Traefik → Astro Container
   Routes based on Host(`astro.localhost`)

3. Astro Container (SSR)
   - Renders page on server
   - Fetches data from PostgreSQL
   - Hydrates Svelte islands

4. Astro Container → PostgreSQL
   SELECT * FROM posts ...

5. Astro Container → Browser
   - Sends server-rendered HTML
   - Client downloads minimal JS
   - Svelte islands hydrate

6. Browser displays feed
   - TanStack Query manages cache
   - Svelte reactivity handles UI
```

## Health Check Flow

```
Every 30 seconds:

Traefik → Flask Container
  GET http://flask:5000/health
  Response: 200 OK ✓

Traefik → Astro Container
  GET http://astro:4321/health
  Response: 200 OK ✓

Traefik → TanStack Container
  GET http://tanstack:3000/health
  Response: 200 OK ✓

Traefik → Angular Container
  GET http://angular:4200/health
  Response: 200 OK ✓

Docker → PostgreSQL
  pg_isready -U social_user -d social_audit
  Response: accepting connections ✓

Docker → Redis
  redis-cli ping
  Response: PONG ✓

If any fail 3 times → Container marked unhealthy
Traefik stops routing to unhealthy containers
```

## Scaling Example

### Scale Flask to 3 instances:

```bash
docker-compose up -d --scale flask=3
```

```
Traefik (Load Balancer)
    │
    ├─→ Flask Instance 1 (25% traffic)
    ├─→ Flask Instance 2 (25% traffic)
    └─→ Flask Instance 3 (50% traffic)
        │
        └─→ PostgreSQL (shared)
```

Traefik automatically:
- Discovers new Flask instances
- Distributes load via round-robin
- Removes unhealthy instances
- Provides sticky sessions (cookies)

## Benefits of This Architecture

### 1. Shared Database
All four stacks use the **same PostgreSQL database**:
- Create user in Flask → visible in Astro/TanStack/Angular
- Like post in Angular → count updates for all stacks
- Real comparison using identical data

### 2. Service Discovery
Traefik automatically detects containers via Docker labels:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.flask.rule=Host(`flask.localhost`)"
```

No manual configuration needed!

### 3. Health Checks
Each container has a health endpoint:
- Unhealthy containers don't receive traffic
- Automatic recovery when healthy again
- Prevents cascading failures

### 4. Development + Production Parity
Same Docker setup works for:
- Local development (docker-compose.yml)
- CI/CD testing
- Production deployment (add HTTPS, scaling, monitoring)

### 5. Easy A/B Testing
Compare stacks side-by-side:
```bash
# Open all in different tabs
make open-all

# Test same feature across stacks
# Example: Create post in Flask
# Refresh Astro → same post appears!
```

## Resource Isolation

Each container has its own:
- File system
- Process space
- Network interface
- CPU/Memory limits (configurable)

But they share:
- Database (PostgreSQL)
- Cache (Redis)
- Network (social-audit-network)

## Comparison Made Easy

| Feature | Flask | Astro | TanStack | Angular |
|---------|-------|-------|----------|---------|
| **URL** | flask.localhost | astro.localhost | tanstack.localhost | angular.localhost |
| **Tech** | Python + HTMx | TS + Svelte | React 19 | Angular 21 |
| **Bundle** | ~15KB | ~80KB | ~280KB | ~150KB |
| **SSR** | ✅ Jinja2 | ✅ Astro | ✅ TanStack | ❌ SPA |
| **Real-time** | SSE | SSE | SSE | SSE |
| **Database** | PostgreSQL (shared) | PostgreSQL (shared) | PostgreSQL (shared) | PostgreSQL (shared) |

**Same data, different approaches!**

---

**One `make up` command = four production-ready stacks running in parallel!** 🚀
