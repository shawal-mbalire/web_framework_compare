/**
 * Root Component (Standalone)
 * Angular 21 with Signals
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header />
      <router-outlet />
    </div>
  `,
  styles: [],
})
export class AppComponent {
  title = 'Social Audit - Angular 21';
}
