# Full-Stack Framework Comparison

> **Enterprise-grade comparison tool for evaluating modern web frameworks through real-world implementation**

A production-ready social media platform (Twitter/X clone) implemented across **four** modern technology stacks, providing objective metrics for **Developer Experience**, **Performance**, **Type Safety**, and **Scalability**.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Framework Implementations](#framework-implementations)
- [Performance Benchmarks](#performance-benchmarks)
- [Feature Matrix](#feature-matrix)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

Deploy all four stacks with Docker Compose:

```bash
# Start all services
docker-compose up -d

# Access the applications
# Flask:    http://flask.localhost
# Astro:    http://astro.localhost
# TanStack: http://tanstack.localhost
# Angular:  http://angular.localhost

# View logs
make logs

# Stop all services
make down
```

---

## Technology Stack

| Stack | Runtime | Framework | Language | Build Tool | Package Manager |
|-------|---------|-----------|----------|------------|----------------|
| **Flask** | Python 3.12+ | Flask 3.1+ | Python | uv | uv |
| **Astro** | Bun | Astro 6 | TypeScript | Vite | Bun |
| **TanStack** | Bun | TanStack Start | TypeScript/React 19 | Vite | Bun |
| **Angular** | Bun | Angular 21 | TypeScript | Angular CLI | Bun |

---

## Architecture

All implementations share:

- **Database**: PostgreSQL 15+ with shared schema ([schema.sql](schema.sql))
- **Authentication**: JWT-based session management
- **Real-time**: Server-Sent Events (SSE) for notifications
- **Features**: Posts, likes, retweets, quote tweets, threaded conversations, infinite scroll

### Key Database Features

- Recursive CTEs for thread hierarchies
- Database triggers for denormalized counts
- GIN indexes for full-text search
- Partial indexes for query optimization

---

## Framework Implementations

### Flask Stack - Server-Rendered Python

**Stack**: Flask 3.1+ | SQLAlchemy 2.0 | Pydantic v2 | HTMx 2.0 | Alpine.js

**Approach**: Hypermedia-driven architecture with minimal client-side JavaScript

**Strengths**:
- Smallest bundle size (~15 KB)
- Excellent Python type safety
- Battle-tested production patterns
- Ultra-fast installs with `uv` (10-100x faster than pip)

**Trade-offs**:
- No end-to-end type safety
- Server round-trips for interactions

**Best For**: Python teams, backend-heavy applications, minimal client complexity

---

### Astro Stack - Islands Architecture

**Stack**: Astro 6 | Svelte 5 Runes | TanStack Query | Zod | Bun

**Approach**: Server-first with selective client-side hydration

**Strengths**:
- Fastest initial load (SSR + partial hydration)
- Small bundle (~80 KB)
- End-to-end type safety via Astro Actions
- Excellent SEO

**Trade-offs**:
- Manual database type definitions
- Learning curve for islands architecture

**Best For**: Content-heavy applications, modern TypeScript teams, optimal performance

---

### TanStack Start - Full-Stack React

**Stack**: TanStack Start | React 19 | TanStack Router/Query/Form | Bun

**Approach**: Type-safe RPC with server functions

**Strengths**:
- Best-in-class type safety (server → client)
- Built-in optimistic UI
- Full-document streaming
- React 19 compiler optimizations

**Trade-offs**:
- Larger bundle (~280 KB)
- React ecosystem dependencies

**Best For**: Highly interactive SPAs, React teams, complex client state

---

### Angular Stack - Signal-Based Framework

**Stack**: Angular 21 | Signals | Zoneless Mode | Standalone Components | Bun

**Approach**: Fine-grained reactivity without Zone.js

**Strengths**:
- Fine-grained reactivity (O(n) vs O(n²))
- End-to-end TypeScript type safety
- Built-in dependency injection
- Opinionated architecture for large teams

**Trade-offs**:
- Medium bundle (~150 KB with Zoneless)
- Steeper learning curve

**Best For**: Enterprise applications, large teams, existing Angular codebases

---

## Performance Benchmarks

| Metric | Flask | Astro | TanStack | Angular |
|--------|-------|-------|----------|---------|
| **Bundle Size** | ~15 KB | ~80 KB | ~280 KB | ~150 KB |
| **Time to Interactive** | ~80ms | ~60ms | ~120ms | ~90ms |
| **Type Safety** | Backend only | End-to-end | End-to-end | End-to-end |
| **Reactivity Model** | HTMx/Alpine | Svelte Runes | React Hooks | Signals |
| **Initial Load Speed** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Developer Experience** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation**: 
- **Astro** - Best overall balance for most projects
- **Angular** - Best for enterprise and large teams
- **TanStack** - Best for React-centric teams
- **Flask** - Best for Python-first teams

---

## Feature Matrix

| Feature | Flask | Astro | TanStack | Angular |
|---------|:-----:|:-----:|:--------:|:-------:|
| User Authentication | ✅ | ✅ | ✅ | ✅ |
| Posts/Tweets | ✅ | ✅ | ✅ | ✅ |
| Like/Unlike | ✅ | ✅ | ✅ | ✅ |
| Retweets | ✅ | ✅ | ✅ | ✅ |
| Quote Tweets | ✅ | ✅ | ✅ | ✅ |
| Threaded Replies | ✅ | ✅ | ✅ | ✅ |
| Follow/Unfollow | ✅ | ✅ | ✅ | ✅ |
| Real-time Notifications | ✅ | ✅ | ✅ | ✅ |
| Infinite Scroll | ✅ | ✅ | ✅ | ✅ |
| Optimistic UI | ⚠️ | ✅ | ✅ | ✅ |
| Full-text Search | ✅ | ✅ | ✅ | ✅ |
| User Profiles | ✅ | ✅ | ✅ | ✅ |

---

## Getting Started

### Prerequisites

```bash
# PostgreSQL 15+
sudo apt install postgresql-15

# Bun (for TypeScript stacks)
curl -fsSL https://bun.sh/install | bash

# uv (for Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Database Setup

```bash
# Create database
createdb social_audit

# Load schema
psql social_audit < schema.sql
```

### Run Individual Stacks

#### Flask

```bash
cd flask-stack
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env
flask --app app run --debug
# http://localhost:5000
```

#### Astro

```bash
cd astro-stack
bun install
cp .env.example .env
bun run dev
# http://localhost:4321
```

#### TanStack

```bash
cd tanstack-stack
bun install
cp .env.example .env
bun run dev
# http://localhost:3000
```

#### Angular

```bash
cd angular-stack
bun install
cp .env.example .env
bun run start
# http://localhost:4200
```

---

## Database Schema

### Core Tables

- **`users`** - User profiles, verification status, follower counts
- **`posts`** - Posts, replies, retweets, quote tweets
- **`likes`** - Post engagement tracking
- **`follows`** - Social graph relationships
- **`notifications`** - Real-time notification system

### Advanced Features

- **Recursive CTEs** - Efficient thread queries
- **Database Triggers** - Auto-update denormalized counts
- **GIN Indexes** - Full-text search optimization
- **Check Constraints** - Data integrity enforcement

See [schema.sql](schema.sql) for complete schema definition.

---

## Testing

### Flask

```bash
cd flask-stack
pytest
pytest --cov=app
mypy app/ --strict
ruff check app/
```

### TypeScript Stacks

```bash
# Astro/TanStack/Angular
bun run test
bun run type-check
bun run lint
```

---

## Deployment

### Docker (Recommended)

```bash
# All stacks with Traefik reverse proxy
docker-compose up -d

# Individual stack
docker-compose up -d flask
```

### Manual Deployment

Each stack includes a `Dockerfile` for containerized deployment:

```bash
cd flask-stack
docker build -t social-flask .
docker run -p 5000:5000 -e DATABASE_URL=... social-flask
```

---

## Project Structure

```
/
├── schema.sql                 # Shared PostgreSQL schema
├── docker-compose.yml         # Multi-stack deployment
├── Makefile                   # Convenience commands
│
├── flask-stack/              # Python implementation
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routes/          # Flask blueprints
│   │   └── templates/       # HTMx templates
│   └── pyproject.toml
│
├── astro-stack/             # Astro implementation
│   ├── src/
│   │   ├── actions/         # Server actions
│   │   ├── components/      # Svelte islands
│   │   ├── pages/           # Routes
│   │   └── lib/             # Database client
│   └── package.json
│
├── tanstack-stack/          # TanStack implementation
│   ├── app/
│   │   ├── routes/          # TanStack Router
│   │   ├── components/      # React components
│   │   └── lib/             # Server functions
│   └── package.json
│
└── angular-stack/           # Angular implementation
    ├── src/
    │   ├── app/
    │   │   ├── core/        # Services & signals
    │   │   ├── features/    # Lazy-loaded routes
    │   │   └── shared/      # Shared components
    │   └── main.ts
    └── package.json
```

---

## Decision Guide

Choose your stack based on:

| Your Requirement | Recommended Stack |
|-----------------|-------------------|
| Python-first team | **Flask** |
| Best SEO & performance | **Astro** |
| Highly interactive SPA | **TanStack** |
| Enterprise/large teams | **Angular** |
| Smallest bundle | **Flask** |
| Modern TypeScript DX | **Astro** or **TanStack** |
| Existing React codebase | **TanStack** |
| Existing Angular codebase | **Angular** |

---

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code standards
- Pull request process
- Development workflow
- Testing requirements

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Useful Commands

```bash
# Show all make commands
make help

# View logs
make logs
make logs-flask
make logs-astro

# Restart services
make restart
make restart-flask

# Rebuild images
make rebuild

# Database operations
make db-shell
make db-reset

# Open in browser
make open-all
```

---

**Built to help teams make informed decisions about modern web frameworks**
