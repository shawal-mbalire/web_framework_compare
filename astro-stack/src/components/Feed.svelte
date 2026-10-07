<!--
  Feed island: SSR'd first page, then cursor-based infinite scroll.
-->
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import PostCard from './PostCard.svelte';
  import { FEED_KEY } from '@/lib/feedCache';
  import type { FeedPage } from '@/lib/schemas';

  let { initialPage, loggedIn }: { initialPage: FeedPage; loggedIn: boolean } = $props();

  const feed = createInfiniteQuery(() => ({
    queryKey: FEED_KEY,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const response = await fetch(`/api/feed?${params}`);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
  }));

  const posts = $derived(feed.data?.pages.flatMap((page) => page.posts) ?? []);

  function infiniteScroll(node: HTMLElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<div class="space-y-4">
  {#each posts as post (post.entryId)}
    <PostCard {post} {loggedIn} />
  {:else}
    <p class="py-8 text-center text-gray-500">No posts yet.</p>
  {/each}

  {#if feed.hasNextPage}
    <div use:infiniteScroll class="py-4 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
    </div>
  {/if}

  {#if feed.isError}
    <div class="py-4 text-center text-red-500">Failed to load feed. Please try again.</div>
  {/if}
</div>
