/**
 * Post card with optimistic like / retweet using signals.
 */
import { Component, inject, input, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';
import type { Post } from '@core/models/post.model';
import { AuthService } from '@core/services/auth.service';
import { PostService } from '@core/services/post.service';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-post-card',
  imports: [RelativeTimePipe],
  template: `
    @let p = post();
    <article class="rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm">
      @if (p.reposted_by) {
        <p class="mb-2 text-sm text-gray-500">↻ &#64;{{ p.reposted_by }} reposted</p>
      }
      <div class="flex gap-3">
        <img
          [src]="p.user.avatar_url || '/avatar.svg'"
          [alt]="p.user.username"
          width="48"
          height="48"
          class="h-12 w-12 rounded-full"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ p.user.display_name || p.user.username }}</span>
            <span class="text-gray-500">&#64;{{ p.user.username }}</span>
            @if (p.user.is_verified) {
              <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            }
            <time class="text-gray-500" [attr.datetime]="p.created_at">· {{ p.created_at | relativeTime }}</time>
          </div>

          <p class="mt-1 whitespace-pre-wrap">{{ p.content }}</p>

          <div class="mt-3 flex gap-6 text-gray-500">
            <button
              type="button"
              aria-label="Like"
              [attr.aria-pressed]="isLiked()"
              (click)="toggleLike()"
              class="flex items-center gap-1 transition-colors hover:text-red-500"
              [class.text-red-500]="isLiked()"
            >
              <svg class="h-5 w-5" [attr.fill]="isLiked() ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{{ likesCount() }}</span>
            </button>

            <button
              type="button"
              aria-label="Retweet"
              [attr.aria-pressed]="isRetweeted()"
              (click)="toggleRetweet()"
              class="flex items-center gap-1 transition-colors hover:text-green-500"
              [class.text-green-500]="isRetweeted()"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ retweetsCount() }}</span>
            </button>

            <span class="flex items-center gap-1" aria-label="Replies">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{{ p.replies_count }}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class PostCardComponent {
  private postService = inject(PostService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly post = input.required<Post>();

  // Local optimistic state that resets whenever a new `post` input arrives.
  // (Reading a required input in the constructor throws NG0950.)
  readonly isLiked = linkedSignal(() => this.post().is_liked);
  readonly likesCount = linkedSignal(() => this.post().likes_count);
  readonly isRetweeted = linkedSignal(() => this.post().is_retweeted);
  readonly retweetsCount = linkedSignal(() => this.post().retweets_count);

  private requireLogin(): boolean {
    if (this.auth.currentUser()) return true;
    void this.router.navigate(['/login']);
    return false;
  }

  async toggleLike(): Promise<void> {
    if (!this.requireLogin()) return;
    const wasLiked = this.isLiked();
    const previousCount = this.likesCount();
    this.isLiked.set(!wasLiked);
    this.likesCount.set(previousCount + (wasLiked ? -1 : 1));

    try {
      const id = this.post().id;
      await (wasLiked ? this.postService.unlikePost(id) : this.postService.likePost(id));
    } catch (error) {
      this.isLiked.set(wasLiked);
      this.likesCount.set(previousCount);
      console.error('Failed to toggle like:', error);
    }
  }

  async toggleRetweet(): Promise<void> {
    if (!this.requireLogin()) return;
    const wasRetweeted = this.isRetweeted();
    const previousCount = this.retweetsCount();
    this.isRetweeted.set(!wasRetweeted);
    this.retweetsCount.set(previousCount + (wasRetweeted ? -1 : 1));

    try {
      await this.postService.toggleRetweet(this.post().id);
    } catch (error) {
      this.isRetweeted.set(wasRetweeted);
      this.retweetsCount.set(previousCount);
      console.error('Failed to toggle retweet:', error);
    }
  }
}
