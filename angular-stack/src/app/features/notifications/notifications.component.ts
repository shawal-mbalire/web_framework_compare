/**
 * Notifications page
 */
import { Component, inject, type OnInit } from '@angular/core';
import type { NotificationType } from '@core/models/post.model';
import { NotificationService } from '@core/services/notification.service';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

const VERBS: Record<NotificationType, string> = {
  LIKE: 'liked your post',
  RETWEET: 'reposted your post',
  QUOTE_TWEET: 'quoted your post',
  REPLY: 'replied to your post',
  FOLLOW: 'followed you',
  MENTION: 'mentioned you',
};

@Component({
  selector: 'app-notifications',
  imports: [RelativeTimePipe],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-6">
      <h1 class="mb-4 text-2xl font-bold">Notifications</h1>

      <div class="divide-y rounded-lg border bg-white">
        @for (notification of notifications(); track notification.id) {
          <button
            type="button"
            class="block w-full p-4 text-left hover:bg-gray-50"
            [class.bg-blue-50]="!notification.is_read"
            (click)="markAsRead(notification.id)"
          >
            <p class="text-sm">
              <strong>&#64;{{ notification.actor.username }}</strong> {{ verbs[notification.type] }}
            </p>
            <p class="text-xs text-gray-500">{{ notification.created_at | relativeTime: ' ago' }}</p>
          </button>
        } @empty {
          <div class="p-8 text-center text-gray-500">No notifications yet</div>
        }
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  readonly verbs = VERBS;
  readonly notifications = this.notificationService.notifications;

  ngOnInit(): void {
    void this.notificationService.loadNotifications();
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }
}
