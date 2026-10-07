<!--
  Post card with optimistic like / retweet (rolled back on error).
-->
<script lang="ts">
  import { actions } from 'astro:actions';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { patchPost } from '@/lib/feedCache';
  import type { PostPublic } from '@/lib/schemas';

  let { post, loggedIn }: { post: PostPublic; loggedIn: boolean } = $props();

  const queryClient = useQueryClient();

  function toggleLiked(p: PostPublic): PostPublic {
    return { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) };
  }

  function toggleRetweeted(p: PostPublic): PostPublic {
    return {
      ...p,
      isRetweeted: !p.isRetweeted,
      retweetsCount: p.retweetsCount + (p.isRetweeted ? -1 : 1),
    };
  }

  const likeMutation = createMutation(() => ({
    mutationFn: (wasLiked: boolean) =>
      wasLiked
        ? actions.unlikePost.orThrow({ postId: post.id })
        : actions.likePost.orThrow({ postId: post.id }),
    onMutate: () => patchPost(queryClient, post.id, toggleLiked),
    onError: () => patchPost(queryClient, post.id, toggleLiked),
  }));

  const retweetMutation = createMutation(() => ({
    mutationFn: () => actions.retweetPost.orThrow({ postId: post.id }),
    onMutate: () => patchPost(queryClient, post.id, toggleRetweeted),
    onError: () => patchPost(queryClient, post.id, toggleRetweeted),
  }));

  function requireLogin(): boolean {
    if (!loggedIn) window.location.href = '/login';
    return loggedIn;
  }

  function formatDate(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 60 / 24)}d`;
  }
</script>

<article class="rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm">
  {#if post.repostedBy}
    <p class="mb-2 text-sm text-gray-500">↻ @{post.repostedBy} reposted</p>
  {/if}
  <div class="flex gap-3">
    <img
      src={post.user.avatarUrl || '/avatar.svg'}
      alt={post.user.username}
      class="h-12 w-12 rounded-full"
      width="48"
      height="48"
    />
    <div class="flex-1">
      <div class="flex items-center gap-2">
        <span class="font-semibold">{post.user.displayName || post.user.username}</span>
        <span class="text-gray-500">@{post.user.username}</span>
        <time class="text-gray-500" datetime={post.createdAt}>· {formatDate(post.createdAt)}</time>
      </div>

      <p class="mt-1 whitespace-pre-wrap">{post.content}</p>

      <div class="mt-3 flex gap-6 text-gray-500">
        <button
          type="button"
          aria-label="Like"
          aria-pressed={post.isLiked}
          onclick={() => requireLogin() && likeMutation.mutate(post.isLiked)}
          class={['flex items-center gap-1 transition-colors hover:text-red-500', post.isLiked && 'text-red-500']}
        >
          <svg class="h-5 w-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likesCount}</span>
        </button>

        <button
          type="button"
          aria-label="Retweet"
          aria-pressed={post.isRetweeted}
          onclick={() => requireLogin() && retweetMutation.mutate()}
          class={['flex items-center gap-1 transition-colors hover:text-green-500', post.isRetweeted && 'text-green-500']}
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{post.retweetsCount}</span>
        </button>

        <span class="flex items-center gap-1" aria-label="Replies">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.repliesCount}</span>
        </span>
      </div>
    </div>
  </div>
</article>
