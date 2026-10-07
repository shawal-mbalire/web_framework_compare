/**
 * Header: auth state and live unread count, both plain signals.
 */
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-10 border-b bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a routerLink="/" class="text-2xl font-bold text-blue-600">Social Audit</a>

        <div class="flex items-center gap-4">
          @if (currentUser(); as user) {
            <a
              routerLink="/notifications"
              class="relative"
              [attr.aria-label]="unreadCount() + ' unread notifications'"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              @if (unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {{ unreadCount() }}
                </span>
              }
            </a>
            <span class="font-semibold">&#64;{{ user.username }}</span>
            <button type="button" (click)="logout()" class="text-blue-600 hover:underline">Log out</button>
          } @else {
            <a routerLink="/login" class="text-blue-600 hover:underline">Log in</a>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly unreadCount = inject(NotificationService).unreadCount;

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
