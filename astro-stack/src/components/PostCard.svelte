<!--
  Post Card Component (Svelte)
  Individual post with optimistic UI for likes/retweets
-->
<script lang="ts">
  import { actions } from 'astro:actions';
  import { useMutation, useQueryClient } from '@tanstack/svelte-query';
  import type { PostPublic } from '@/lib/schemas';
  
  export let post: PostPublic;
  
  const queryClient = useQueryClient();
  
  // Optimistic like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.is_liked) {
        return actions.unlikePost({ postId: post.id });
      } else {
        return actions.likePost({ postId: post.id });
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousData = queryClient.getQueryData(['feed']);
      
      queryClient.setQueryData(['feed'], (old: any) => {
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: PostPublic) =>
              p.id === post.id
                ? {
                    ...p,
                    is_liked: !p.is_liked,
                    likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
                  }
                : p
            ),
          })),
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['feed'], context.previousData);
      }
    },
  });
  
  // Similar for retweet
  const retweetMutation = useMutation({
    mutationFn: async () => {
      return actions.retweetPost({ postId: post.id });
    },
    // ... similar optimistic logic
  });
  
  function handleLike() {
    $likeMutation.mutate();
  }
  
  function handleRetweet() {
    $retweetMutation.mutate();
  }
  
  function formatDate(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    
    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }
</script>

<div class="bg-white rounded-lg p-4 border hover:shadow-sm transition-shadow">
  <div class="flex gap-3">
    <img
      src={post.user?.avatar_url || 'https://via.placeholder.com/48'}
      alt={post.user?.username}
      class="w-12 h-12 rounded-full"
    />
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{post.user?.display_name || post.user?.username}</span>
        <span class="text-gray-500">@{post.user?.username}</span>
        <span class="text-gray-500">· {formatDate(post.created_at)}</span>
      </div>
      
      <p class="mt-1 whitespace-pre-wrap">{post.content}</p>
      
      {#if post.media_urls && post.media_urls.length > 0}
        <div class="mt-2 grid grid-cols-2 gap-2">
          {#each post.media_urls as url}
            <img src={url} alt="" class="rounded-lg w-full" />
          {/each}
        </div>
      {/if}
      
      <!-- Engagement buttons -->
      <div class="flex gap-6 mt-3 text-gray-500">
        <button
          on:click={handleLike}
          class="flex items-center gap-1 hover:text-red-500 transition-colors"
          class:text-red-500={post.is_liked}
        >
          <svg class="w-5 h-5" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likes_count}</span>
        </button>
        
        <button
          on:click={handleRetweet}
          class="flex items-center gap-1 hover:text-green-500 transition-colors"
          class:text-green-500={post.is_retweeted}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{post.retweets_count}</span>
        </button>
        
        <button class="flex items-center gap-1 hover:text-blue-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.replies_count}</span>
        </button>
      </div>
    </div>
  </div>
</div>
