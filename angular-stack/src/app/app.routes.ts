/**
 * App routes (lazy-loaded standalone components)
 */
import { inject } from '@angular/core';
import { Router, type Routes } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

const requireAuth = () =>
  inject(AuthService).currentUser() ? true : inject(Router).createUrlTree(['/login']);

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/feed/feed.component').then((m) => m.FeedComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explore/explore.component').then((m) => m.ExploreComponent),
  },
  {
    path: 'notifications',
    canActivate: [requireAuth],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
  },
  {
    path: 'profile/:username',
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: '**', redirectTo: '' },
];
