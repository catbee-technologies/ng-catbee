import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a string to camelCase.
 *
 * @example
 * ```html
 * {{ 'hello world' | camelCase }}
 * <!-- Output: "helloWorld" -->
 *
 * {{ 'hello-world' | camelCase }}
 * <!-- Output: "helloWorld" -->
 *
 * {{ 'hello_world' | camelCase }}
 * <!-- Output: "helloWorld" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'camelCase',
  standalone: true
})
export class CamelCasePipe implements PipeTransform {
  /**
   * Converts the input string to camelCase.
   *
   * @param value - The string to convert
   * @returns The camelCase string
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';

    return value.toLowerCase().replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
  }
}
