/**
 * Feed page: signal state + cursor-based infinite scroll.
 */
import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { Post } from '@core/models/post.model';
import { AuthService } from '@core/services/auth.service';
import { PostService } from '@core/services/post.service';
import { ComposeComponent } from '@shared/components/compose/compose.component';
import { PostCardComponent } from '@shared/components/post-card/post-card.component';

@Component({
  selector: 'app-feed',
  imports: [RouterLink, RouterLinkActive, PostCardComponent, ComposeComponent],
  template: `
    <main class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-3">
      <aside class="hidden md:block">
        <nav class="space-y-1 rounded-lg border bg-white p-4">
          <a routerLink="/" routerLinkActive="bg-blue-50 font-semibold text-blue-600" [routerLinkActiveOptions]="{ exact: true }" class="block rounded px-4 py-2 hover:bg-gray-100">Home</a>
          <a routerLink="/explore" routerLinkActive="bg-blue-50 font-semibold text-blue-600" class="block rounded px-4 py-2 hover:bg-gray-100">Explore</a>
          <a routerLink="/notifications" routerLinkActive="bg-blue-50 font-semibold text-blue-600" class="block rounded px-4 py-2 hover:bg-gray-100">Notifications</a>
        </nav>
      </aside>

      <div class="space-y-4 md:col-span-2">
        @if (auth.currentUser()) {
          <app-compose (postCreated)="reload()" />
        }

        @for (post of posts(); track post.entry_id) {
          <app-post-card [post]="post" />
        } @empty {
          @if (!loading()) {
            <div class="py-8 text-center text-gray-500">No posts yet.</div>
          }
        }

        @if (error()) {
          <div class="py-4 text-center text-red-500">Failed to load feed. Please try again.</div>
        }

        @if (nextCursor()) {
          <div #loadMore class="py-4 text-center">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        }
      </div>
    </main>
  `,
})
export class FeedComponent {
  private postService = inject(PostService);
  protected auth = inject(AuthService);

  readonly posts = signal<Post[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  private readonly loadMore = viewChild<ElementRef<HTMLElement>>('loadMore');
  private readonly observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) void this.loadNextPage();
    },
    { rootMargin: '200px' }
  );

  constructor() {
    void this.reload();
    // Observe the sentinel whenever it is (re)rendered
    effect(() => {
      const el = this.loadMore()?.nativeElement;
      this.observer.disconnect();
      if (el) this.observer.observe(el);
    });
    inject(DestroyRef).onDestroy(() => this.observer.disconnect());
  }

  async reload(): Promise<void> {
    await this.fetchPage(null, true);
  }

  private async loadNextPage(): Promise<void> {
    const cursor = this.nextCursor();
    if (cursor) await this.fetchPage(cursor, false);
  }

  private async fetchPage(cursor: string | null, replace: boolean): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(false);
    try {
      const data = await this.postService.getFeed(cursor);
      this.posts.update((existing) => (replace ? data.posts : [...existing, ...data.posts]));
      this.nextCursor.set(data.next_cursor);
    } catch (err) {
      this.error.set(true);
      console.error('Failed to load feed:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
