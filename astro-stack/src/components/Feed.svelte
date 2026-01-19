<!--
  Feed Component (Svelte Island)
  Infinite scroll feed with TanStack Query for caching
-->
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import PostCard from './PostCard.svelte';
  import type { PostPublic } from '@/lib/schemas';
  
  export let initialPosts: PostPublic[] = [];
  
  // TanStack Query for feed data with infinite scroll
  const feedQuery = createInfiniteQuery({
    queryKey: ['feed'],
    initialData: {
      pages: [{ posts: initialPosts, nextCursor: null }],
      pageParams: [null],
    },
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      
      const response = await fetch(`/api/feed?${params}`);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  
  $: posts = $feedQuery.data?.pages.flatMap(page => page.posts) ?? [];
  $: hasMore = $feedQuery.hasNextPage;
  
  function handleScroll(node: HTMLElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !$feedQuery.isFetchingNextPage) {
          $feedQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      },
    };
  }
</script>

<div class="space-y-4">
  {#each posts as post (post.id)}
    <PostCard {post} />
  {/each}
  
  {#if hasMore}
    <div use:handleScroll class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  {/if}
  
  {#if $feedQuery.isError}
    <div class="text-center text-red-500 py-4">
      Failed to load feed. Please try again.
    </div>
  {/if}
</div>
