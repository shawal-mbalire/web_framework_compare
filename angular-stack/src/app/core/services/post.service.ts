/**
 * Post API client
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { FeedResponse } from '@core/models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);

  getFeed(cursor?: string | null): Promise<FeedResponse> {
    const params: Record<string, string> = cursor ? { cursor } : {};
    return firstValueFrom(this.http.get<FeedResponse>('/api/feed', { params }));
  }

  createPost(content: string): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>('/api/posts', { content }));
  }

  async likePost(postId: string): Promise<void> {
    await firstValueFrom(this.http.post(`/api/posts/${postId}/like`, {}));
  }

  async unlikePost(postId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/posts/${postId}/like`));
  }

  /** Toggles the current user's retweet of the post. */
  toggleRetweet(postId: string): Promise<{ retweeted: boolean }> {
    return firstValueFrom(
      this.http.post<{ retweeted: boolean }>(`/api/posts/${postId}/retweet`, {})
    );
  }
}
