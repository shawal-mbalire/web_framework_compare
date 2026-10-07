# Full-Stack Framework Comparison

The same Twitter/X-style app built four ways against **one shared PostgreSQL schema**, so the
differences you see come from the framework and not from the data model.

| Stack | Rendering model | Server code | Client state |
|---|---|---|---|
| [**Flask**](flask-stack/) | Server-rendered HTML, forms + redirects, no JS framework | Flask blueprints, SQLAlchemy 2.1 ORM | none (the server is the state) |
| [**Astro**](astro-stack/) | SSR pages + a Svelte 5 island | Astro Actions + API route, postgres.js | TanStack Query (svelte) |
| [**TanStack Start**](tanstack-stack/) | Streaming SSR React 19 with hydration | `createServerFn` RPC, postgres.js | TanStack Query (react), SSR-dehydrated |
| [**Angular**](angular-stack/) | Client-rendered SPA (zoneless, signals) | Separate Bun + Express JSON API, postgres.js | Signals / `linkedSignal` |

---

## Quick start

```bash
docker compose up -d --build     # or: make up
```

| App | URL |
|---|---|
| Flask | http://flask.localhost |
| Astro | http://astro.localhost |
| TanStack | http://tanstack.localhost |
| Angular | http://angular.localhost |
| Traefik dashboard | http://localhost:8080 |

Postgres is initialised from [`schema.sql`](schema.sql) on first start. Log in with any seed
account — `alice`, `bob`, `carol`, `dave`, `erin` — password **`password123`**. Because every
stack reads and writes the same database, a like in one app shows up in the others.

`make help` lists the other commands (logs, rebuild, `db-shell`, `db-reset`, `check`, …).

---

## Versions

| | Flask | Astro | TanStack | Angular |
|---|---|---|---|---|
| Framework | Flask 3.1 | Astro 7 + Svelte 5 | TanStack Start 1.168 + React 19 | Angular 22 |
| Language | Python 3.12 | TypeScript 6 | TypeScript 6 | TypeScript 6 |
| Data access | SQLAlchemy 2.1 + psycopg 3 | postgres.js | postgres.js | postgres.js |
| Validation | Pydantic v2 | Zod 4 | Zod 4 (+ TanStack Form) | Zod 4 (server), reactive forms |
| Styling | Hand-written CSS | Tailwind 4 | Tailwind 4 | Tailwind 4 |
| Auth | Signed cookie session | JWT cookie (`jose`) | Sealed cookie (`useSession`) | JWT cookie (`jose`) |
| Tooling | uv, Ruff, mypy (strict), pytest | Bun, `astro check`, `svelte-check` | Bun, Vite 8, `tsc` | Bun, Angular CLI, `tsc` |
| Production server | gunicorn (gthread) | `@astrojs/node` standalone | srvx | Bun + Express |

All passwords are bcrypt hashes, so an account created in one stack can log in to the others.

---

## Feature status

What is actually implemented today (✅ done · ➖ not yet):

| Feature | Flask | Astro | TanStack | Angular |
|---|:-:|:-:|:-:|:-:|
| Register / login / logout | ✅ | ✅ | ✅ | ✅ |
| Global feed with pagination | ✅ pages | ✅ infinite scroll | ✅ infinite scroll | ✅ infinite scroll |
| Home timeline (followed users) | ✅ | ➖ | ➖ | ➖ |
| Create post | ✅ | ✅ | ✅ | ✅ |
| Like / unlike | ✅ | ✅ optimistic | ✅ optimistic | ✅ optimistic |
| Retweet / undo | ✅ | ✅ optimistic | ✅ optimistic | ✅ optimistic |
| Replies & thread view | ✅ | ➖ (action only) | ➖ | ➖ |
| Delete own post | ✅ | ➖ (action only) | ➖ | ➖ |
| Follow / unfollow, profiles | ✅ | ➖ (action only) | ➖ | ➖ |
| Notifications | ✅ page + SSE count | ➖ (actions only) | ✅ unread count | ✅ page + SSE count |
| Full-text search | ✅ | ➖ | ➖ | ➖ |
| Trending (24h engagement score) | ✅ | ➖ | ➖ | ➖ |
| Works without JavaScript | ✅ | login only | ➖ | ➖ |
| Automated tests | ✅ pytest | type-check + build | type-check + build | type-check + build |

The Flask stack is the most complete and serves as the reference implementation; the
others cover the core read/write loop (auth, feed, post, like, retweet) so the
interesting parts of each framework — SSR, hydration, optimistic updates, RPC — can be
compared like for like.

---

## Shared database

[`schema.sql`](schema.sql) is the single source of truth (no stack runs migrations):

- `users`, `posts`, `follows`, `likes`, `notifications`, `bookmarks`, `sessions`
- Replies use `parent_id` / `root_post_id` / `thread_depth`; retweets and quote tweets use
  `original_post_id` with generated `is_retweet` / `is_quote_tweet` columns
- Triggers keep denormalised counters (`likes_count`, `followers_count`, …) in sync
- Partial and GIN indexes for the feed and full-text search
- `get_user_feed()` and the recursive `get_thread()` helper functions
- Fictional seed users, posts, follows and likes

## Running a stack without Docker

```bash
createdb social_audit && psql social_audit < schema.sql
```

Then follow the README in [`flask-stack`](flask-stack/), [`astro-stack`](astro-stack/),
[`tanstack-stack`](tanstack-stack/) or [`angular-stack`](angular-stack/).

## Quality checks

```bash
make check    # every stack: lint / type-check / tests / production build
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same checks, then builds
every Docker image and smoke-tests each app through Traefik.

## Project structure

```
├── schema.sql            # shared PostgreSQL schema + seed data
├── docker-compose.yml    # Traefik + Postgres + the four apps
├── Makefile
├── flask-stack/          # app/{routes,services,models,templates}, tests/
├── astro-stack/          # src/{pages,actions,components,lib}
├── tanstack-stack/       # app/{routes,components,lib}
└── angular-stack/        # src/app/{core,features,shared}, server/ (API)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
