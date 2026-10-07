/**
 * Login / registration page
 */
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) return err.error?.error ?? err.message;
  return 'Something went wrong';
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="mx-auto grid max-w-3xl gap-6 px-4 py-10 md:grid-cols-2">
      <form [formGroup]="loginForm" (ngSubmit)="login()" class="space-y-3 rounded-lg border bg-white p-6">
        <h1 class="text-xl font-bold">Log in</h1>
        <input class="w-full rounded border p-2" formControlName="username" name="username" placeholder="Username or email" autocomplete="username" />
        <input class="w-full rounded border p-2" formControlName="password" name="password" type="password" placeholder="Password" autocomplete="current-password" />
        @if (loginError()) {
          <p class="text-sm text-red-500">{{ loginError() }}</p>
        }
        <button class="w-full rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50" [disabled]="loginForm.invalid">
          Log in
        </button>
        <p class="text-sm text-gray-500">Demo accounts: alice, bob, carol… password <code>password123</code></p>
      </form>

      <form [formGroup]="registerForm" (ngSubmit)="register()" class="space-y-3 rounded-lg border bg-white p-6">
        <h2 class="text-xl font-bold">Create account</h2>
        <input class="w-full rounded border p-2" formControlName="username" name="username" placeholder="Username" autocomplete="username" />
        <input class="w-full rounded border p-2" formControlName="email" name="email" type="email" placeholder="Email" autocomplete="email" />
        <input class="w-full rounded border p-2" formControlName="password" name="password" type="password" placeholder="Password (8+ characters)" autocomplete="new-password" />
        @if (registerError()) {
          <p class="text-sm text-red-500">{{ registerError() }}</p>
        }
        <button class="w-full rounded-full bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50" [disabled]="registerForm.invalid">
          Sign up
        </button>
      </form>
    </main>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loginError = signal<string | null>(null);
  readonly registerError = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly registerForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,20}$/)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  async login(): Promise<void> {
    const { username, password } = this.loginForm.getRawValue();
    try {
      await this.auth.login(username, password);
      await this.router.navigate(['/']);
    } catch (err) {
      this.loginError.set(errorMessage(err));
    }
  }

  async register(): Promise<void> {
    const { username, email, password } = this.registerForm.getRawValue();
    try {
      await this.auth.register(username, email, password);
      await this.router.navigate(['/']);
    } catch (err) {
      this.registerError.set(errorMessage(err));
    }
  }
}
