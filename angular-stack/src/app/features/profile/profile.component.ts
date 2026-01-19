/**
 * Profile Component
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-4">Profile</h1>
      <div class="bg-white rounded-lg p-8 text-center text-gray-500">
        Coming soon...
      </div>
    </div>
  `,
})
export class ProfileComponent {}
