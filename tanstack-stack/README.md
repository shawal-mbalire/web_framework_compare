# TanStack Start - Social Architecture Audit

Full-stack React implementation using TanStack Router, Query, and Form for E2E type-safe state management.

## Tech Stack

- **Framework**: TanStack Start (Full-stack React)
- **Router**: TanStack Router (File-based, type-safe)
- **State**: TanStack Query (Server-state caching)
- **Forms**: TanStack Form (Type-safe forms with Zod)
- **Database**: PostgreSQL 15+ via `node-postgres`
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS
- **Runtime**: Node.js with Vinxi

## Architecture

### TanStack Start
- **Full-Stack React**: Client and server in one framework
- **Server Functions**: Type-safe RPC between client/server
- **File-based Routing**: Automatic route generation
- **SSR + Streaming**: Fast initial loads
- **E2E Type Safety**: From database to UI components

### TanStack Query
- **Client-Side Caching**: Automatic background refetching
- **Optimistic Updates**: Instant UI feedback
- **Infinite Queries**: Built-in pagination
- **DevTools**: Debug cache state

### TanStack Form
- **Type-Safe Forms**: Zod validation
- **Field-Level Validation**: Real-time feedback
- **Submission State**: Loading/error handling

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
cd tanstack-stack
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
# Edit .env
```

### Running

**Development**:
```bash
npm run dev
# Opens on http://localhost:3000
```

**Production build**:
```bash
npm run build
npm run start
```

**Type checking**:
```bash
npm run type-check
```

## Key Features

### 1. Server Functions (Type-Safe RPC)
```typescript
// app/lib/server.ts
export const createPostFn = createServerFn('POST', async (data: unknown) => {
  const input = postCreateSchema.parse(data);
  // Insert into database
  return createdPost;
});

// In component
import { createPostFn } from '~/lib/server';
const result = await createPostFn({ content: 'Hello' });
//    ^? Fully typed!
```

### 2. TanStack Query for Caching
```typescript
const feedQuery = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => getFeedFn(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

### 3. Optimistic UI
```typescript
const likeMutation = useMutation({
  mutationFn: likePostFn,
  onMutate: async () => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['feed'] });
    
    // Snapshot previous value
    const previousData = queryClient.getQueryData(['feed']);
    
    // Optimistically update
    queryClient.setQueryData(['feed'], (old) => updateLikeCount(old));
    
    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['feed'], context.previousData);
  },
});
```

### 4. TanStack Form with Zod
```typescript
const form = useForm({
  defaultValues: { content: '' },
  validatorAdapter: zodValidator,
  onSubmit: async ({ value }) => {
    await createPostMutation.mutateAsync(value);
  },
});

<form.Field
  name="content"
  validators={{ onChange: z.string().max(280) }}
  children={(field) => (
    <textarea
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
/>
```

## Project Structure

```
tanstack-stack/
├── app/
│   ├── routes/          # File-based routes
│   │   └── index.tsx    # Home page
│   ├── components/
│   │   ├── Feed.tsx     # Infinite scroll feed
│   │   ├── PostCard.tsx # Individual post
│   │   ├── Compose.tsx  # Create post form
│   │   └── Header.tsx
│   ├── lib/
│   │   ├── server.ts    # Server functions
│   │   ├── db.ts        # Database client
│   │   └── schemas.ts   # Zod schemas
│   ├── router.tsx       # Router configuration
│   ├── client.tsx       # Client entry
│   ├── server.tsx       # Server entry
│   └── styles.css
├── app.config.ts
├── package.json
└── tsconfig.json
```

## Type Safety

### E2E Type Inference
```typescript
// Server function return type is inferred
export const getUserFn = createServerFn('GET', async (username: string) => {
  return await fetchUser(username); // Returns UserPublic
});

// Client automatically knows the return type
const user = await getUserFn('john');
//    ^? UserPublic
```

### Zod Schemas
```typescript
const postCreateSchema = z.object({
  content: z.string().max(280),
});

type PostCreate = z.infer<typeof postCreateSchema>;
// Runtime validation + TypeScript types
```

### Database Types
```typescript
// Typed query results
const users = await sql<UserPublic[]>`
  SELECT id, username, display_name FROM users
`;
// users is UserPublic[]
```

## Performance Optimizations

1. **Server-Side Rendering**: Fast initial page loads
2. **Code Splitting**: Automatic route-based splitting
3. **React Streaming**: Progressive HTML rendering
4. **TanStack Query Cache**: Reduces server requests
5. **Optimistic Updates**: Instant UI feedback

## Bundle Size

Expected bundles:
- **Client JS**: 200-300 KB (gzipped ~80-100 KB)
  - React: ~40 KB
  - TanStack Router: ~20 KB
  - TanStack Query: ~15 KB
  - TanStack Form: ~10 KB
  - App code: ~100 KB
- **Server**: No limit (runs on Node.js)

Compare to:
- Flask + HTMx: ~0 KB client JS
- Astro: ~50-80 KB (partial hydration)

## DevTools

### TanStack Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### TanStack Router DevTools
```typescript
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

<TanStackRouterDevtools position="bottom-right" />
```

## Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

## Deployment

### Node.js Server
```bash
npm run build
npm run start
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
CMD ["npm", "run", "start"]
```

### Environment Variables
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=production
```

## Benchmark Metrics

Track in [../ANALYTICS.md](../ANALYTICS.md):
- **Bundle size**: ~200-300 KB (largest of three stacks)
- **TBT**: Low with React Server Components
- **Type-safety**: 100% E2E (server functions + Zod + TypeScript)
- **DX**: Excellent (full React ecosystem)
- **UX**: Great (optimistic UI + caching)

## Migration Guide

From Create React App or Vite:
1. **Move components**: Keep existing React components
2. **Replace routing**: Use TanStack Router
3. **Replace API calls**: Use server functions
4. **Add TanStack Query**: Wrap API calls with `useQuery`
5. **Add TanStack Form**: Replace form libraries

## Why TanStack Start?

### Pros
- **E2E Type Safety**: From database to UI
- **Modern React**: Server Components, Streaming SSR
- **TanStack Ecosystem**: Best-in-class routing, queries, forms
- **DX**: Excellent developer experience
- **Performance**: Optimistic UI, caching, SSR

### Cons
- **Bundle Size**: Largest JS payload (~200-300 KB)
- **Complexity**: More moving parts than HTMx
- **SEO**: Good but not as good as Astro

## Learn More

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
