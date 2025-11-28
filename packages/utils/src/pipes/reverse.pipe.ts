import { Pipe, PipeTransform } from '@angular/core';

/**
 * Reverses a string or array.
 *
 * @example
 * ```html
 * {{ 'hello' | reverse }}
 * <!-- Output: "olleh" -->
 *
 * {{ [1, 2, 3] | reverse }}
 * <!-- Output: [3, 2, 1] -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'reverse',
  standalone: true
})
export class ReversePipe implements PipeTransform {
  /**
   * Reverses the input string or array.
   *
   * @param value - The string or array to reverse
   * @returns The reversed value
   */
  transform<T>(value: string | T[] | null | undefined): string | T[] {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.split('').reverse().join('');
    }

    if (Array.isArray(value)) {
      return [...value].reverse();
    }

    return value;
  }
}
