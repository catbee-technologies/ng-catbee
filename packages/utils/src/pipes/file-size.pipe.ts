import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a number of bytes into a human-readable file size.
 *
 * @example
 * ```html
 * {{ 1024 | fileSize }}
 * <!-- Output: "1 KB" -->
 *
 * {{ 1536 | fileSize }}
 * <!-- Output: "1.5 KB" -->
 *
 * {{ 1048576 | fileSize }}
 * <!-- Output: "1 MB" -->
 *
 * {{ 1048576 | fileSize:0 }}
 * <!-- Output: "1 MB" (no decimals) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  private readonly units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  /**
   * Transforms bytes into a formatted file size string.
   *
   * @param bytes - Number of bytes
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted file size string
   */
  transform(bytes: number | null | undefined, decimals = 2): string {
    if (bytes == null || bytes === 0) return '0 B';
    if (bytes < 0) return 'Invalid';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(dm)} ${this.units[i]}`;
  }
}
