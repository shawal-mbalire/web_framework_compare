/**
 * Compose box: reactive form + signals (character count via toSignal).
 */
import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '@core/services/post.service';

const MAX_LENGTH = 280;

@Component({
  selector: 'app-compose',
  imports: [ReactiveFormsModule],
  template: `
    <div class="rounded-lg border bg-white p-4">
      <form (submit)="$event.preventDefault(); onSubmit()">
        <textarea
          [formControl]="content"
          placeholder="What's happening?"
          aria-label="Post content"
          class="w-full resize-none rounded border p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          rows="3"
        ></textarea>

        <div class="mt-2 flex items-center justify-between">
          <span class="text-sm" [class.text-red-500]="charCount() > maxLength" [class.text-gray-500]="charCount() <= maxLength">
            {{ charCount() }}/{{ maxLength }}
          </span>

          <button
            type="submit"
            [disabled]="!canSubmit()"
            class="rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ posting() ? 'Posting...' : 'Post' }}
          </button>
        </div>

        @if (error()) {
          <p class="mt-2 text-sm text-red-500">{{ error() }}</p>
        }
      </form>
    </div>
  `,
})
export class ComposeComponent {
  private postService = inject(PostService);

  readonly maxLength = MAX_LENGTH;
  readonly postCreated = output<string>();

  readonly content = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_LENGTH)],
  });

  private readonly value = toSignal(this.content.valueChanges, { initialValue: '' });
  readonly charCount = computed(() => this.value().trim().length);
  readonly posting = signal(false);
  readonly error = signal<string | null>(null);
  readonly canSubmit = computed(
    () => this.charCount() > 0 && this.charCount() <= MAX_LENGTH && !this.posting()
  );

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.posting.set(true);
    this.error.set(null);
    try {
      const { id } = await this.postService.createPost(this.content.value.trim());
      this.content.reset();
      this.postCreated.emit(id);
    } catch (err) {
      this.error.set(err instanceof HttpErrorResponse ? (err.error?.error ?? err.message) : 'Failed to post');
    } finally {
      this.posting.set(false);
    }
  }
}
