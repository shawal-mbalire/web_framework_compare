import { createRootRoute, createRouter, createRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import React from 'react';
import RootLayout from '~/components/RootLayout';
import Home from '~/routes/index';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <RootLayout />
      <ReactQueryDevtools initialIsOpen={false} />
      <TanStackRouterDevtools position="bottom-right" />
    </QueryClientProvider>
  ),
});

// Index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

// Route tree
const routeTree = rootRoute.addChildren([indexRoute]);

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
