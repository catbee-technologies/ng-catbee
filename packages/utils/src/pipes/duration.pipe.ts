import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @example
 * ```html
 * {{ 90000 | duration }}
 * <!-- Output: "1m 30s" -->
 *
 * {{ 3665000 | duration:'long' }}
 * <!-- Output: "1 hour 1 minute 5 seconds" -->
 *
 * {{ 3665000 | duration:'short' }}
 * <!-- Output: "1h 1m 5s" -->
 *
 * {{ 3665000 | duration:'full' }}
 * <!-- Output: "01:01:05" (HH:MM:SS format) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  /**
   * Transforms milliseconds into a duration string.
   *
   * @param value - Duration in milliseconds
   * @param format - Output format: 'short', 'long', or 'full'
   * @returns Formatted duration string
   */
  transform(value: number | null | undefined, format: 'short' | 'long' | 'full' = 'short'): string {
    if (value == null || value < 0) return '';

    const seconds = Math.floor(value / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const s = seconds % 60;
    const m = minutes % 60;
    const h = hours % 24;

    if (format === 'full') {
      const pad = (num: number) => num.toString().padStart(2, '0');
      if (days > 0) {
        return `${days}d ${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    const parts: string[] = [];

    if (days > 0) {
      parts.push(format === 'long' ? `${days} day${days !== 1 ? 's' : ''}` : `${days}d`);
    }
    if (h > 0) {
      parts.push(format === 'long' ? `${h} hour${h !== 1 ? 's' : ''}` : `${h}h`);
    }
    if (m > 0) {
      parts.push(format === 'long' ? `${m} minute${m !== 1 ? 's' : ''}` : `${m}m`);
    }
    if (s > 0 || parts.length === 0) {
      parts.push(format === 'long' ? `${s} second${s !== 1 ? 's' : ''}` : `${s}s`);
    }

    return parts.join(' ');
  }
}
