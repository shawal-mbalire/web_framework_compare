import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { feedQueryOptions } from '~/lib/queries';
import { POST_MAX_LENGTH, postCreateSchema } from '~/lib/schemas';
import { createPostFn } from '~/lib/server';

export default function Compose() {
  const queryClient = useQueryClient();
  const createPost = useServerFn(createPostFn);

  const createPostMutation = useMutation({
    mutationFn: (content: string) => createPost({ data: { content } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: feedQueryOptions.queryKey }),
  });

  const form = useForm({
    defaultValues: { content: '' },
    // Standard Schema: TanStack Form v1 accepts Zod schemas directly
    validators: { onChange: postCreateSchema },
    onSubmit: async ({ value, formApi }) => {
      await createPostMutation.mutateAsync(value.content);
      formApi.reset();
    },
  });

  return (
    <div className="rounded-lg border bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="content">
          {(field) => (
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="What's happening?"
              aria-label="Post content"
              className="w-full resize-none rounded border p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
            />
          )}
        </form.Field>

        <div className="mt-2 flex items-center justify-between">
          <form.Subscribe selector={(state) => state.values.content.trim().length}>
            {(charCount) => (
              <span
                className={`text-sm ${charCount > POST_MAX_LENGTH ? 'text-red-500' : 'text-gray-500'}`}
              >
                {charCount}/{POST_MAX_LENGTH}
              </span>
            )}
          </form.Subscribe>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting, state.values.content] as const}
          >
            {([canSubmit, isSubmitting, content]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting || content.trim().length === 0}
                className="rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            )}
          </form.Subscribe>
        </div>

        {createPostMutation.error && (
          <p className="mt-2 text-sm text-red-500">{createPostMutation.error.message}</p>
        )}
      </form>
    </div>
  );
}
