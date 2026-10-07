<!--
  Single island root: one QueryClient shared by Compose and Feed.
-->
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import Compose from './Compose.svelte';
  import Feed from './Feed.svelte';
  import type { FeedPage } from '@/lib/schemas';

  let { initialPage, loggedIn }: { initialPage: FeedPage; loggedIn: boolean } = $props();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });
</script>

<QueryClientProvider client={queryClient}>
  <div class="space-y-4">
    {#if loggedIn}
      <Compose />
    {/if}
    <Feed {initialPage} {loggedIn} />
  </div>
</QueryClientProvider>
