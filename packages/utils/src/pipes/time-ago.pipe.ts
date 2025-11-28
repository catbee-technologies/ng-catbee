import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a date to a human-readable "time ago" string.
 *
 * @example
 * ```html
 * {{ date | timeAgo }}
 * <!-- Output: "5 minutes ago", "2 hours ago", "3 days ago", etc. -->
 *
 * {{ date | timeAgo:true }}
 * <!-- Output: "5m", "2h", "3d" (short format) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  /**
   * Transforms a date into a relative time string.
   *
   * @param value - The date to transform
   * @param short - If true, uses abbreviated format
   * @returns The time ago string
   */
  transform(value: Date | string | number | null | undefined, short = false): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) return short ? 'now' : 'just now';

    const intervals: Record<string, number> = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    const shortLabels: Record<string, string> = {
      year: 'y',
      month: 'mo',
      week: 'w',
      day: 'd',
      hour: 'h',
      minute: 'm',
      second: 's'
    };

    for (const [interval, secondsInInterval] of Object.entries(intervals)) {
      const count = Math.floor(seconds / secondsInInterval);

      if (count >= 1) {
        if (short) {
          return `${count}${shortLabels[interval]}`;
        }
        return `${count} ${interval}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return short ? 'now' : 'just now';
  }
}
