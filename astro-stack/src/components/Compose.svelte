<!--
  Compose island: creates a post via an Astro Action, then refreshes the feed.
-->
<script lang="ts">
  import { actions } from 'astro:actions';
  import { createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { FEED_KEY } from '@/lib/feedCache';
  import { POST_MAX_LENGTH } from '@/lib/schemas';

  const queryClient = useQueryClient();

  let content = $state('');
  const charCount = $derived(content.trim().length);
  const isValid = $derived(charCount > 0 && charCount <= POST_MAX_LENGTH);

  const createPost = createMutation(() => ({
    mutationFn: (text: string) => actions.createPost.orThrow({ content: text }),
    onSuccess: () => {
      content = '';
      return queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  }));

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (isValid && !createPost.isPending) createPost.mutate(content);
  }
</script>

<div class="rounded-lg border bg-white p-4">
  <form onsubmit={handleSubmit}>
    <textarea
      bind:value={content}
      placeholder="What's happening?"
      aria-label="Post content"
      class="w-full resize-none rounded border p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      rows="3"
    ></textarea>
    <div class="mt-2 flex items-center justify-between">
      <span class={['text-sm', charCount > POST_MAX_LENGTH ? 'text-red-500' : 'text-gray-500']}>
        {charCount}/{POST_MAX_LENGTH}
      </span>
      <button
        type="submit"
        disabled={!isValid || createPost.isPending}
        class="rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createPost.isPending ? 'Posting...' : 'Post'}
      </button>
    </div>
    {#if createPost.isError}
      <p class="mt-2 text-sm text-red-500">{createPost.error?.message}</p>
    {/if}
  </form>
</div>
