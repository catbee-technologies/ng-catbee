import { Pipe, PipeTransform } from '@angular/core';

/**
 * Calculates and formats the percentage change between two numbers.
 *
 * @example
 * ```html
 * {{ [100, 150] | percentageChange }}
 * <!-- Output: "+50%" -->
 *
 * {{ [150, 100] | percentageChange }}
 * <!-- Output: "-33.33%" -->
 *
 * {{ [100, 150] | percentageChange:0 }}
 * <!-- Output: "+50%" (no decimals) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'percentageChange',
  standalone: true
})
export class PercentageChangePipe implements PipeTransform {
  /**
   * Calculates the percentage change between two numbers.
   *
   * @param value - Array containing [oldValue, newValue]
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted percentage change string with sign
   */
  transform(value: [number, number] | null | undefined, decimals = 2): string {
    if (!value || !Array.isArray(value) || value.length !== 2) return '0%';

    const [oldValue, newValue] = value;

    if (oldValue === 0) {
      return newValue > 0 ? '+∞%' : '0%';
    }

    const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
    const sign = change > 0 ? '+' : '';

    return `${sign}${change.toFixed(decimals)}%`;
  }
}
