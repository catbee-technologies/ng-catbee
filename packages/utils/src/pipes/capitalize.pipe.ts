import { Pipe, PipeTransform } from '@angular/core';

/**
 * Capitalizes the first letter of a string or each word.
 *
 * @example
 * ```html
 * <!-- Capitalize first letter -->
 * {{ 'hello world' | capitalize }}
 * <!-- Output: "Hello world" -->
 *
 * <!-- Capitalize each word -->
 * {{ 'hello world' | capitalize:true }}
 * <!-- Output: "Hello World" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'capitalize',
  standalone: true
})
export class CapitalizePipe implements PipeTransform {
  /**
   * Capitalizes the input string.
   *
   * @param value - The string to capitalize
   * @param allWords - If true, capitalizes each word
   * @returns The capitalized string
   */
  transform(value: string | null | undefined, allWords = false): string {
    if (!value) return '';

    if (allWords) {
      return value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
