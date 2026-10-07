# TanStack Start Stack

**TanStack Start** (React 19, SSR + streaming) with **TanStack Router** (file-based, typed
routes), **TanStack Query** (SSR-dehydrated cache, optimistic updates), **TanStack Form**
(validated with the same Zod schemas as the server), **postgres.js**, and **Tailwind CSS v4**.
Built with Vite; served in production by [srvx](https://srvx.h3.dev).

## How it fits together

| Concern | Implementation |
|---|---|
| Routing | `app/routes/*` → generated `app/routeTree.gen.ts`; `__root.tsx` renders the HTML shell |
| Data on first paint | the `/` route loader calls `queryClient.ensureInfiniteQueryData(...)` on the server; `@tanstack/react-router-ssr-query` streams the cache to the browser |
| Server code | `app/lib/server.ts` – `createServerFn().validator(zodSchema).handler(...)`; handler bodies and `*.server.ts` imports are stripped from the client bundle |
| Per-request isolation | `getRouter()` creates a fresh router + `QueryClient` per request |
| Optimistic UI | `PostCard.tsx` patches cached feed pages in `onMutate`, reverts in `onError` |
| Auth | Start's sealed cookie session (`useSession`) + bcrypt (`bcryptjs`) |
| Health check | server route in `app/routes/health.ts` |

Implemented server functions: login, register, logout, current user, cursor-paginated feed,
create post, like / unlike, retweet toggle, unread notification count.
Not built yet: replies UI, profiles, follow, notifications page.

## Running locally

```bash
# Database (from the repo root)
createdb social_audit && psql social_audit < ../schema.sql

cd tanstack-stack
bun install
cp .env.example .env
bun run dev           # http://localhost:3000
```

Seed accounts: `alice`, `bob`, `carol`, `dave`, `erin` — password `password123`.

## Scripts

```bash
bun run type-check    # tsc --noEmit
bun run build         # vite build → dist/client + dist/server
bun run start         # srvx serving dist/server/server.js and dist/client
```
