<!--
  Compose Component (Svelte Island)
  Client-side interactivity for creating posts
-->
<script lang="ts">
  import { actions } from 'astro:actions';
  
  let content = '';
  let posting = false;
  
  $: charCount = content.length;
  $: isValid = charCount > 0 && charCount <= 280;
  
  async function handleSubmit() {
    if (!isValid || posting) return;
    
    posting = true;
    try {
      await actions.createPost({ content });
      content = '';
      // TODO: Invalidate feed query
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      posting = false;
    }
  }
</script>

<div class="bg-white rounded-lg p-4 border">
  <form on:submit|preventDefault={handleSubmit}>
    <textarea
      bind:value={content}
      placeholder="What's happening?"
      class="w-full border rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      rows="3"
    />
    <div class="flex justify-between items-center mt-2">
      <span class="text-sm" class:text-red-500={charCount > 280} class:text-gray-500={charCount <= 280}>
        {charCount}/280
      </span>
      <button
        type="submit"
        disabled={!isValid || posting}
        class="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {posting ? 'Posting...' : 'Post'}
      </button>
    </div>
  </form>
</div>
