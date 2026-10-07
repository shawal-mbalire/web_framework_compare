/**
 * Notifications as signals, with a live unread count over Server-Sent Events.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Notification, NotificationsResponse } from '@core/models/post.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private eventSource: EventSource | null = null;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  constructor() {
    // Re-runs whenever the currentUser signal changes (login / logout)
    effect(() => {
      if (this.auth.currentUser()) {
        this.connectSSE();
      } else {
        this.disconnectSSE();
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  async loadNotifications(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<NotificationsResponse>('/api/notifications')
      );
      this.notifications.set(data.notifications);
      this.unreadCount.set(data.unread_count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  markAsRead(notificationId: string): void {
    const target = this.notifications().find((n) => n.id === notificationId);
    if (!target || target.is_read) return;

    // Optimistic update, rolled back on error
    const setRead = (isRead: boolean) => {
      this.notifications.update((list) =>
        list.map((n) => (n.id === notificationId ? { ...n, is_read: isRead } : n))
      );
      this.unreadCount.update((count) => Math.max(0, count + (isRead ? -1 : 1)));
    };
    setRead(true);
    this.http.post(`/api/notifications/${notificationId}/read`, {}).subscribe({
      error: () => setRead(false),
    });
  }

  private connectSSE(): void {
    if (this.eventSource) return;
    this.eventSource = new EventSource('/api/notifications/stream');
    this.eventSource.addEventListener('unread', (event) => {
      const { unread_count } = JSON.parse((event as MessageEvent<string>).data);
      this.unreadCount.set(unread_count);
    });
    // EventSource reconnects on its own after transient errors
  }

  private disconnectSSE(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
