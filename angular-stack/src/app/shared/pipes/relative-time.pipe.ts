import { Pipe, type PipeTransform } from '@angular/core';

/** Compact relative time: now, 5m, 3h, 2d */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(iso: string, suffix = ''): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m${suffix}`;
    if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h${suffix}`;
    return `${Math.floor(minutes / 60 / 24)}d${suffix}`;
  }
}
