# Astro Stack - Social Architecture Audit

Professional Twitter/X clone using Astro with SSR, TypeScript, and Svelte/React islands for interactivity.

## Tech Stack

- **Framework**: Astro 4.x (SSR mode)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ via `node-postgres`
- **Validation**: Zod schemas
- **Islands**: Svelte 4 (can also use React)
- **State Management**: TanStack Query (Svelte)
- **Styling**: Tailwind CSS
- **Auth**: JWT with session cookies

## Architecture

### Astro SSR
- **Server-Side Rendering**: Fast initial page loads with SEO optimization
- **Astro Actions**: Type-safe server mutations (replaces API routes)
- **Islands Architecture**: Client-side JS only where needed
- **Type Safety**: E2E type safety from database to UI

### Svelte Islands
- **Selective Hydration**: `client:load`, `client:visible`, `client:idle`
- **TanStack Query**: Client-state caching and optimistic updates
- **Reactive**: Svelte's compiler-based reactivity

## Setup

### Prerequisites
```bash
# Node.js 18+ 
nvm install 18
nvm use 18

# PostgreSQL 15+
sudo apt install postgresql-15
```

### Installation

1. **Install dependencies**:
```bash
cd astro-stack
npm install
```

2. **Setup database**:
```bash
# Create database
createdb social_audit

# Run schema
psql social_audit < ../schema.sql
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

### Running

**Development server**:
```bash
npm run dev
# Opens on http://localhost:4321
```

**Production build**:
```bash
npm run build
npm run preview
```

**Type checking**:
```bash
npm run astro check
```

## Key Features

### 1. Astro Actions (Type-Safe Mutations)
```typescript
// src/actions/index.ts
export const server = {
  createPost: defineAction({
    input: z.object({ content: z.string().max(280) }),
    handler: async (input) => { /* ... */ }
  })
};

// In Svelte component
import { actions } from 'astro:actions';
await actions.createPost({ content: 'Hello' });
```

### 2. SSR with Islands
```astro
---
// Fetch data server-side
const posts = await fetchPosts();
---

<!-- Static HTML -->
<header>...</header>

<!-- Interactive island (hydrated on client) -->
<Feed client:load initialPosts={posts} />
```

### 3. TanStack Query for Caching
```svelte
<script>
const feedQuery = createInfiniteQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
</script>
```

### 4. Optimistic UI
```svelte
const likeMutation = useMutation({
  mutationFn: likePost,
  onMutate: async () => {
    // Update UI immediately
    queryClient.setQueryData(['feed'], optimisticUpdate);
  }
});
```

## Project Structure

```
astro-stack/
├── src/
│   ├── actions/         # Astro Actions (type-safe server functions)
│   │   └── index.ts
│   ├── components/      # Svelte/React islands
│   │   ├── Feed.svelte
│   │   ├── PostCard.svelte
│   │   └── Compose.svelte
│   ├── layouts/         # Astro layouts
│   │   └── Layout.astro
│   ├── pages/           # File-based routing
│   │   ├── index.astro
│   │   ├── explore.astro
│   │   └── [username]/
│   │       └── index.astro
│   ├── lib/
│   │   ├── db.ts        # Database client
│   │   └── schemas.ts   # Zod schemas
│   └── styles/
│       └── global.css
├── public/              # Static assets
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## API Routes vs Actions

Astro Actions provide **E2E type safety** without manual API routes:

**Traditional API Route**:
```typescript
// src/pages/api/posts.ts
export async function POST(request: Request) {
  const body = await request.json();
  // No type safety between client and server
}
```

**Astro Actions** (Preferred):
```typescript
// src/actions/index.ts
export const server = {
  createPost: defineAction({
    input: postSchema,  // Type-safe!
    handler: async (input) => { /* ... */ }
  })
};
```

## Performance Optimizations

1. **Partial Hydration**: Islands only load JS where needed
2. **SSR**: Initial HTML served fast for SEO
3. **TanStack Query**: Client-side caching reduces server load
4. **Code Splitting**: Astro automatically splits per-route
5. **Tailwind JIT**: Only CSS that's used is bundled

## Type Safety

### Database → TypeScript
```typescript
// lib/db.ts
export interface User {
  id: UUID;
  username: string;
  // ... fully typed
}
```

### Actions → Components
```typescript
// Full type inference
const result = await actions.createPost({ content: 'test' });
//    ^? result is typed based on action return type
```

### Zod Validation
```typescript
const postSchema = z.object({
  content: z.string().max(280),
});

// Runtime validation + TypeScript types
type PostCreate = z.infer<typeof postSchema>;
```

## Bundle Size Analysis

```bash
npm run analyze
```

Expected bundle sizes:
- **SSR HTML**: ~10-20 KB (gzipped)
- **Svelte Islands**: ~5-10 KB per island
- **TanStack Query**: ~10 KB
- **Total JS**: ~50-80 KB for full interactivity

Compare to:
- Traditional SPA: 200-500 KB
- Flask + HTMx: ~0 KB (CDN)

## Deployment

### Standalone Node Server
```bash
npm run build
node dist/server/entry.mjs
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
CMD ["node", "./dist/server/entry.mjs"]
```

### Nginx Reverse Proxy
```nginx
location / {
  proxy_pass http://localhost:4321;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
}
```

## Benchmark Metrics

Track in [../ANALYTICS.md](../ANALYTICS.md):
- Bundle size: ~50-80 KB JS (much smaller than TanStack Start)
- TBT: Very low due to SSR + partial hydration
- Type-safety: 100% E2E with Actions + Zod
- SEO: Excellent (SSR by default)

## Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

## Migration from SPA

If you have an existing React SPA:
1. **Keep React components**: Use `@astrojs/react` integration
2. **Convert pages to `.astro`**: File-based routing
3. **Use Actions**: Replace fetch calls with type-safe actions
4. **Add SSR data fetching**: `const data = await fetch()` in frontmatter

## Learn More

- [Astro Docs](https://docs.astro.build)
- [Astro Actions](https://docs.astro.build/en/guides/actions/)
- [TanStack Query (Svelte)](https://tanstack.com/query/latest/docs/framework/svelte/overview)
