/**
 * Compose Component with Signal Forms
 * Angular 21 - Demonstrates new Signal-based forms
 */

import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '@core/services/post.service';
import { Post } from '@core/models/post.model';

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg p-4 border">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <textarea
          formControlName="content"
          placeholder="What's happening?"
          class="w-full border rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        ></textarea>

        <!-- Character count (using Signal) -->
        <div class="flex justify-between items-center mt-2">
          <span
            class="text-sm"
            [class.text-red-500]="charCount() > 280"
            [class.text-gray-500]="charCount() <= 280"
          >
            {{ charCount() }}/280
          </span>

          <button
            type="submit"
            [disabled]="!form.valid || posting()"
            class="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ posting() ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [],
})
export class ComposeComponent {
  private postService = inject(PostService);

  // Output event (Angular 21 uses output() instead of @Output)
  postCreated = output<Post>();

  // Signal for posting state
  posting = signal(false);

  // Signal for character count (computed from form value)
  charCount = signal(0);

  // Signal Form (Angular 21 feature!)
  form = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.maxLength(280)]),
  });

  constructor() {
    // Watch form value changes and update charCount signal
    this.form.get('content')?.valueChanges.subscribe((value) => {
      this.charCount.set(value?.length || 0);
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || this.posting()) return;

    this.posting.set(true);
    try {
      const post = await this.postService.createPost({
        content: this.form.value.content || '',
      });
      this.postCreated.emit(post);
      this.form.reset();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      this.posting.set(false);
    }
  }
}

import { inject } from '@angular/core';
