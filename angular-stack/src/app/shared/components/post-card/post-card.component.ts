/**
 * Post Card Component with Optimistic UI using Signals
 * Angular 21 - Demonstrates template spread operators
 */

import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '@core/models/post.model';
import { PostService } from '@core/services/post.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg p-4 border hover:shadow-sm transition-shadow">
      <div class="flex gap-3">
        <img
          [src]="post().user.avatar_url || 'https://via.placeholder.com/48'"
          [alt]="post().user.username"
          class="w-12 h-12 rounded-full"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ post().user.display_name || post().user.username }}</span>
            <span class="text-gray-500">@\{{ post().user.username }}</span>
            @if (post().user.is_verified) {
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            }
            <span class="text-gray-500">· {{ formatDate(post().created_at) }}</span>
          </div>

          <p class="mt-1 whitespace-pre-wrap">{{ post().content }}</p>

          <!-- Engagement buttons (Optimistic UI with Signals!) -->
          <div class="flex gap-6 mt-3 text-gray-500">
            <button
              (click)="toggleLike()"
              class="flex items-center gap-1 hover:text-red-500 transition-colors"
              [class.text-red-500]="isLiked()"
            >
              <svg class="w-5 h-5" [attr.fill]="isLiked() ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{{ likesCount() }}</span>
            </button>

            <button
              (click)="toggleRetweet()"
              class="flex items-center gap-1 hover:text-green-500 transition-colors"
              [class.text-green-500]="isRetweeted()"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ retweetsCount() }}</span>
            </button>

            <button class="flex items-center gap-1 hover:text-blue-500 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{{ post().replies_count }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PostCardComponent {
  private postService = inject(PostService);

  // Input signal (Angular 21 - replaces @Input)
  post = input.required<Post>();

  // Signals for optimistic UI
  isLiked = signal(false);
  isRetweeted = signal(false);
  likesCount = signal(0);
  retweetsCount = signal(0);

  constructor() {
    // Initialize signals from post data (effect runs when post() changes)
    this.isLiked.set(this.post().is_liked || false);
    this.isRetweeted.set(this.post().is_retweeted || false);
    this.likesCount.set(this.post().likes_count);
    this.retweetsCount.set(this.post().retweets_count);
  }

  async toggleLike(): Promise<void> {
    const previousValue = this.isLiked();
    const previousCount = this.likesCount();

    // Optimistic update
    this.isLiked.set(!previousValue);
    this.likesCount.set(previousValue ? previousCount - 1 : previousCount + 1);

    try {
      if (previousValue) {
        await this.postService.unlikePost(this.post().id);
      } else {
        await this.postService.likePost(this.post().id);
      }
    } catch (error) {
      // Rollback on error
      this.isLiked.set(previousValue);
      this.likesCount.set(previousCount);
      console.error('Failed to toggle like:', error);
    }
  }

  async toggleRetweet(): Promise<void> {
    const previousValue = this.isRetweeted();
    const previousCount = this.retweetsCount();

    // Optimistic update
    this.isRetweeted.set(!previousValue);
    this.retweetsCount.set(previousValue ? previousCount - 1 : previousCount + 1);

    try {
      await this.postService.retweetPost(this.post().id);
    } catch (error) {
      // Rollback on error
      this.isRetweeted.set(previousValue);
      this.retweetsCount.set(previousCount);
      console.error('Failed to toggle retweet:', error);
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);

    if (hours < 1) return 'now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }
}

import { inject } from '@angular/core';
