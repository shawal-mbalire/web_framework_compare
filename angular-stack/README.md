# Angular Stack

**Angular 22** single-page app — standalone components, **signals** for all state,
**zoneless** change detection, the built-in control flow (`@if` / `@for`), lazy routes —
styled with **Tailwind CSS v4**. Unlike the other stacks, Angular has no server runtime of
its own here, so `server/` contains a small **Bun + Express 5** JSON API (postgres.js, Zod,
bcrypt, JWT cookie) that also serves the production build.

## How it fits together

| Concern | Implementation |
|---|---|
| Change detection | `provideZonelessChangeDetection()` — no zone.js in the bundle |
| State | `AuthService.currentUser`, `NotificationService.unreadCount`, component `signal()`s |
| Optimistic UI | `PostCardComponent` uses `linkedSignal()` per field: resets when the `post` input changes, flipped locally on click, rolled back on error |
| Infinite scroll | `FeedComponent` observes a `viewChild` sentinel inside an `effect()`; cursor pagination |
| Live notifications | `NotificationService` opens an `EventSource` in an `effect()` tied to the current user |
| Auth | httpOnly JWT cookie set by the API; restored with `provideAppInitializer` before first render |
| API | `server/index.ts`: `/api/auth/*`, `/api/feed`, `/api/posts`, likes, retweets, notifications + SSE stream, `/health` |

Not built yet: explore, profile, replies.

## Running locally

```bash
# Database (from the repo root)
createdb social_audit && psql social_audit < ../schema.sql

cd angular-stack
bun install
cp .env.example .env
bun run api        # API on http://localhost:4300
bun run start      # ng serve on http://localhost:4200, proxies /api → 4300
```

Production: `bun run build && bun run serve:prod` (API + SPA on port 4200).

Seed accounts: `alice`, `bob`, `carol`, `dave`, `erin` — password `password123`.

> The scripts run the Angular CLI with `bun --bun` so they work regardless of the local
> Node.js version (the Angular 22 CLI requires Node ≥ 22.22.3).

## Scripts

```bash
bun run type-check   # tsc for the app and for server/
bun run build        # ng build (strict templates) → dist/social-audit-angular
```
