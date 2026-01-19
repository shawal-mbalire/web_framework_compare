/**
 * Header Component using Signals
 * Angular 21 Zoneless Mode
 */

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <a routerLink="/" class="text-2xl font-bold text-blue-600">
          Social Audit
        </a>

        <div class="flex gap-4 items-center">
          @if (currentUser(); as user) {
            <!-- Notification Bell (2026: Signals make this reactive!) -->
            <button
              class="relative"
              [class.animate-pulse]="unreadCount() > 0"
              (click)="toggleNotifications()"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              @if (unreadCount() > 0) {
                <span
                  class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {{ unreadCount() }}
                </span>
              }
            </button>

            <span class="font-semibold">@\{{ user.username }}</span>
          } @else {
            <a routerLink="/login" class="text-blue-600 hover:underline">
              Login
            </a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [],
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Signals (Angular 21's reactive primitives)
  currentUser = this.authService.currentUser;
  notifications = this.notificationService.notifications;

  // Computed signal (auto-updates when notifications change)
  unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.is_read).length;
  });

  // Signal-based state for dropdown
  showNotifications = signal(false);

  toggleNotifications() {
    this.showNotifications.update((v) => !v);
  }
}
