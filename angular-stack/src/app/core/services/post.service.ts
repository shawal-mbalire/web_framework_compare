/**
 * Post Service with API integration
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post } from '@core/models/post.model';

interface FeedResponse {
  posts: Post[];
  has_more: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private http = inject(HttpClient);

  async getFeed(cursor?: string): Promise<FeedResponse> {
    const params = cursor ? { cursor } : {};
    return await this.http
      .get<FeedResponse>('/api/feed', { params })
      .toPromise()
      .then((data) => data || { posts: [], has_more: false });
  }

  async createPost(data: { content: string; parent_id?: string }): Promise<Post> {
    const post = await this.http.post<Post>('/api/posts', data).toPromise();
    return post!;
  }

  async likePost(postId: string): Promise<void> {
    await this.http.post(`/api/posts/${postId}/like`, {}).toPromise();
  }

  async unlikePost(postId: string): Promise<void> {
    await this.http.delete(`/api/posts/${postId}/like`).toPromise();
  }

  async retweetPost(postId: string): Promise<Post> {
    const post = await this.http.post<Post>(`/api/posts/${postId}/retweet`, {}).toPromise();
    return post!;
  }

  async getThread(postId: string): Promise<{ posts: Post[] }> {
    const data = await this.http
      .get<{ posts: Post[] }>(`/api/posts/${postId}/thread`)
      .toPromise();
    return data || { posts: [] };
  }
}
