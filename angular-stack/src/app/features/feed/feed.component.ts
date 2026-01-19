/**
 * Feed Component using Signal Forms
 * Angular 21 Zoneless Mode
 */

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostCardComponent } from '@shared/components/post-card/post-card.component';
import { ComposeComponent } from '@shared/components/compose/compose.component';
import { PostService } from '@core/services/post.service';
import { Post } from '@core/models/post.model';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PostCardComponent, ComposeComponent],
  template: `
    <main class="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Sidebar -->
      <aside class="hidden md:block">
        <nav class="bg-white rounded-lg p-4 space-y-2">
          <a routerLink="/" class="block px-4 py-2 rounded bg-blue-50 text-blue-600 font-semibold">
            Home
          </a>
          <a routerLink="/explore" class="block px-4 py-2 rounded hover:bg-gray-100">
            Explore
          </a>
          <a routerLink="/notifications" class="block px-4 py-2 rounded hover:bg-gray-100">
            Notifications
          </a>
        </nav>
      </aside>

      <!-- Feed -->
      <div class="md:col-span-2 space-y-4">
        <!-- Compose -->
        <app-compose (postCreated)="onPostCreated($event)" />

        <!-- Posts -->
        @for (post of posts(); track post.id) {
          <app-post-card [post]="post" />
        } @empty {
          <div class="text-center text-gray-500 py-8">
            No posts yet. Follow someone to see their posts!
          </div>
        }

        <!-- Infinite Scroll Trigger -->
        @if (hasMore()) {
          <div #loadMore class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }
      </div>
    </main>
  `,
  styles: [],
})
export class FeedComponent implements OnInit {
  private postService = inject(PostService);

  // Signals for reactive state
  posts = signal<Post[]>([]);
  hasMore = signal(true);
  loading = signal(false);

  ngOnInit(): void {
    this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    try {
      const data = await this.postService.getFeed();
      this.posts.set(data.posts);
      this.hasMore.set(data.has_more);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onPostCreated(post: Post): void {
    // Prepend new post (Signal update)
    this.posts.update((posts) => [post, ...posts]);
  }
}
