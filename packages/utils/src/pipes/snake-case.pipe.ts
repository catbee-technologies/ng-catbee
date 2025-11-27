import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a string to snake_case.
 *
 * @example
 * ```html
 * {{ 'helloWorld' | snakeCase }}
 * <!-- Output: "hello_world" -->
 *
 * {{ 'Hello World' | snakeCase }}
 * <!-- Output: "hello_world" -->
 *
 * {{ 'hello-world' | snakeCase }}
 * <!-- Output: "hello_world" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'snakeCase',
  standalone: true
})
export class SnakeCasePipe implements PipeTransform {
  /**
   * Converts the input string to snake_case.
   *
   * @param value - The string to convert
   * @returns The snake_case string
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }
}
