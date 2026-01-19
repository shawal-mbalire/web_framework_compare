/**
 * Notification Service using Signals
 * Demonstrates real-time SSE integration
 */

import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id: string;
  type: 'LIKE' | 'RETWEET' | 'REPLY' | 'FOLLOW' | 'MENTION';
  is_read: boolean;
  created_at: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);

  // Signal for notifications list
  notifications = signal<Notification[]>([]);

  // SSE connection for real-time updates
  private eventSource: EventSource | null = null;

  constructor() {
    // Auto-effect: Runs when currentUser changes (Angular 21!)
    effect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        this.connectSSE();
      } else {
        this.disconnectSSE();
      }
    });
  }

  async loadNotifications(): Promise<void> {
    try {
      const data = await this.http
        .get<{ notifications: Notification[] }>('/api/notifications')
        .toPromise();
      this.notifications.set(data?.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  markAsRead(notificationId: string): void {
    // Optimistic update (Signal pattern)
    this.notifications.update((notifications) =>
      notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );

    // Send to server
    this.http
      .post(`/api/notifications/${notificationId}/read`, {})
      .subscribe({
        error: () => {
          // Rollback on error
          this.notifications.update((notifications) =>
            notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: false } : n
            )
          );
        },
      });
  }

  private connectSSE(): void {
    if (this.eventSource) return;

    this.eventSource = new EventSource('/api/notifications/stream');

    this.eventSource.addEventListener('notification', (event) => {
      const notification: Notification = JSON.parse(event.data);
      // Prepend new notification (Signal update)
      this.notifications.update((notifications) => [notification, ...notifications]);
    });

    this.eventSource.addEventListener('error', () => {
      console.error('SSE connection failed');
      this.disconnectSSE();
    });
  }

  private disconnectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

import { inject } from '@angular/core';
