import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a number to its ordinal representation.
 *
 * @example
 * ```html
 * {{ 1 | ordinal }}
 * <!-- Output: "1st" -->
 *
 * {{ 2 | ordinal }}
 * <!-- Output: "2nd" -->
 *
 * {{ 3 | ordinal }}
 * <!-- Output: "3rd" -->
 *
 * {{ 21 | ordinal }}
 * <!-- Output: "21st" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'ordinal',
  standalone: true
})
export class OrdinalPipe implements PipeTransform {
  /**
   * Transforms a number into its ordinal form.
   *
   * @param value - The number to transform
   * @returns The ordinal string (e.g., "1st", "2nd", "3rd")
   */
  transform(value: number | null | undefined): string {
    if (value == null) return '';

    const num = Math.floor(value);
    const lastDigit = num % 10;
    const lastTwoDigits = num % 100;

    // Handle special cases: 11th, 12th, 13th
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${num}th`;
    }

    switch (lastDigit) {
      case 1:
        return `${num}st`;
      case 2:
        return `${num}nd`;
      case 3:
        return `${num}rd`;
      default:
        return `${num}th`;
    }
  }
}
