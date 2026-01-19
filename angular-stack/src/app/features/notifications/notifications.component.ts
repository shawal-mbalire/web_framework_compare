/**
 * Notifications Component with Signals
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '@core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-4">Notifications</h1>

      <div class="bg-white rounded-lg divide-y">
        @for (notification of notifications(); track notification.id) {
          <div
            class="p-4 hover:bg-gray-50 cursor-pointer"
            [class.bg-blue-50]="!notification.is_read"
            (click)="markAsRead(notification.id)"
          >
            <div class="flex items-start gap-3">
              <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                @switch (notification.type) {
                  @case ('LIKE') {
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                  }
                  @case ('RETWEET') {
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  }
                  @default {
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  }
                }
              </svg>
              <div>
                <p class="text-sm">
                  <strong>{{ notification.type }}</strong> notification
                </p>
                <p class="text-xs text-gray-500">{{ formatDate(notification.created_at) }}</p>
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-8 text-center text-gray-500">No notifications yet</div>
        }
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  notifications = this.notificationService.notifications;

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);

    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
