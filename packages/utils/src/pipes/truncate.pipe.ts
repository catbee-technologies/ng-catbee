import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates a string to a specified length and adds an ellipsis or custom suffix.
 *
 * @example
 * ```html
 * <!-- Basic truncation to 10 characters -->
 * {{ 'This is a very long text' | truncate:10 }}
 * <!-- Output: "This is a..." -->
 *
 * <!-- Custom suffix -->
 * {{ 'This is a very long text' | truncate:10:'...' }}
 * <!-- Output: "This is a..." -->
 *
 * <!-- Without ellipsis -->
 * {{ 'This is a very long text' | truncate:10:'' }}
 * <!-- Output: "This is a " -->
 *
 * <!-- Preserve whole words -->
 * {{ 'This is a very long text' | truncate:10:'...':true }}
 * <!-- Output: "This is..." -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  /**
   * Truncates the input string to the specified length.
   *
   * @param value - The string to truncate
   * @param limit - Maximum length of the string
   * @param ellipsis - Suffix to add when truncated (default: '...')
   * @param preserveWords - If true, truncates at word boundaries
   * @returns The truncated string
   */
  transform(value: string | null | undefined, limit = 100, ellipsis = '...', preserveWords = false): string {
    if (!value) return '';

    if (value.length <= limit) {
      return value;
    }

    let truncated = value.substring(0, limit);

    if (preserveWords) {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 0) {
        truncated = truncated.substring(0, lastSpace);
      }
    }

    return truncated + ellipsis;
  }
}
