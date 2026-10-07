# Astro Stack

**Astro 7** (SSR via `@astrojs/node`) with **Svelte 5** islands (runes), **TanStack Query**
for client caching / optimistic updates, **Astro Actions** + **Zod** for type-safe mutations,
**postgres.js** for SQL, and **Tailwind CSS v4**.

## How it fits together

| Concern | Implementation |
|---|---|
| First paint | `src/pages/index.astro` queries Postgres on the server and renders the first feed page |
| Interactivity | One Svelte island (`FeedApp.svelte`, `client:load`) owns a `QueryClient` shared by `Compose` and `Feed` |
| Infinite scroll | `GET /api/feed?cursor=...` – cursor pagination on `(created_at, id)` |
| Mutations | `src/actions/index.ts` – `actions.likePost.orThrow(...)` from islands; login/register/logout are `accept: 'form'` actions that work without JS |
| Optimistic UI | `PostCard.svelte` patches the cached feed in `onMutate` and reverts in `onError` |
| Auth | HS256 JWT (`jose`) in an httpOnly, SameSite=Lax cookie; `src/middleware.ts` puts the user on `Astro.locals` |
| Passwords | `bcryptjs` (compatible with the hashes the Flask stack writes) |

Implemented actions: `login`, `register`, `logout`, `createPost` (incl. replies), `deletePost`,
`likePost`, `unlikePost`, `retweetPost` (toggle), `followUser`, `unfollowUser`,
`markNotificationRead`, `markAllNotificationsRead`.
Not built yet: profile, thread, explore and notification pages.

## Running locally

```bash
# Database (from the repo root)
createdb social_audit && psql social_audit < ../schema.sql

cd astro-stack
bun install
cp .env.example .env
bun run dev           # http://localhost:4321
```

Seed accounts: `alice`, `bob`, `carol`, `dave`, `erin` — password `password123`.

## Scripts

```bash
bun run type-check    # astro check + svelte-check
bun run build         # production build → dist/
bun run start         # node dist/server/entry.mjs
```
