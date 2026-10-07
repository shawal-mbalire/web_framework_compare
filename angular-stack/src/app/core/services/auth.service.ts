/**
 * Auth state as a signal. The session itself is an httpOnly cookie set by the
 * API server, so no token is ever exposed to JavaScript.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { User } from '@core/models/post.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);

  async login(username: string, password: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.post<User>('/api/auth/login', { username, password })
    );
    this.currentUser.set(user);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.post<User>('/api/auth/register', { username, email, password })
    );
    this.currentUser.set(user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}));
    this.currentUser.set(null);
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.http.get<User | null>('/api/auth/me'));
      this.currentUser.set(user);
    } catch {
      this.currentUser.set(null);
    }
  }
}
