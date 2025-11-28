import { Pipe, PipeTransform } from '@angular/core';

/**
 * Abbreviates large numbers with K, M, B, T suffixes.
 *
 * @example
 * ```html
 * {{ 1500 | abbreviateNumber }}
 * <!-- Output: "1.5K" -->
 *
 * {{ 1500000 | abbreviateNumber }}
 * <!-- Output: "1.5M" -->
 *
 * {{ 1500000000 | abbreviateNumber }}
 * <!-- Output: "1.5B" -->
 *
 * {{ 1500 | abbreviateNumber:0 }}
 * <!-- Output: "2K" (rounded, no decimals) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'abbreviateNumber',
  standalone: true
})
export class AbbreviateNumberPipe implements PipeTransform {
  private readonly suffixes = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  /**
   * Abbreviates a number with K, M, B, T suffixes.
   *
   * @param value - The number to abbreviate
   * @param decimals - Number of decimal places (default: 1)
   * @returns Abbreviated number string
   */
  transform(value: number | null | undefined, decimals = 1): string {
    if (value == null) return '';
    if (value === 0) return '0';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    for (const { value: threshold, symbol } of this.suffixes) {
      if (absValue >= threshold) {
        const abbreviated = absValue / threshold;
        return `${sign}${abbreviated.toFixed(decimals)}${symbol}`;
      }
    }

    return value.toString();
  }
}
