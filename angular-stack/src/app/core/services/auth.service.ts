/**
 * Auth Service using Signals
 * Angular 21 Zoneless Mode
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  // Signal for current user (replaces BehaviorSubject!)
  currentUser = signal<User | null>(null);

  login(username: string, password: string): Observable<{ user: User; token: string }> {
    return this.http
      .post<{ user: User; token: string }>('/api/auth/login', {
        username,
        password,
      })
      .pipe(
        tap((response) => {
          // Update signal (triggers all dependents automatically)
          this.currentUser.set(response.user);
          localStorage.setItem('token', response.token);
        })
      );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
  }

  // Auto-fetch current user on init
  async loadCurrentUser(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const user = await this.http.get<User>('/api/auth/me').toPromise();
      this.currentUser.set(user || null);
    } catch (error) {
      console.error('Failed to load user:', error);
      this.logout();
    }
  }
}

// Helper to inject HttpClient (Angular 21 pattern)
import { inject } from '@angular/core';
