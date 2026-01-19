import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPostFn } from '~/lib/server';
import { postCreateSchema } from '~/lib/schemas';

export default function Compose() {
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: createPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      form.reset();
    },
  });

  const form = useForm({
    defaultValues: {
      content: '',
    },
    validatorAdapter: zodValidator,
    onSubmit: async ({ value }) => {
      await createPostMutation.mutateAsync(value);
    },
  });

  return (
    <div className="bg-white rounded-lg p-4 border">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="content"
          validators={{
            onChange: postCreateSchema.shape.content,
          }}
          children={(field) => (
            <>
              <textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What's happening?"
                className="w-full border rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              {field.state.meta.errors && (
                <span className="text-red-500 text-sm">{field.state.meta.errors}</span>
              )}
            </>
          )}
        />

        <div className="flex justify-between items-center mt-2">
          <form.Subscribe
            selector={(state) => state.values.content}
            children={(content) => {
              const charCount = content?.length || 0;
              const isOverLimit = charCount > 280;
              return (
                <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                  {charCount}/280
                </span>
              );
            }}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            )}
          />
        </div>
      </form>
    </div>
  );
}
