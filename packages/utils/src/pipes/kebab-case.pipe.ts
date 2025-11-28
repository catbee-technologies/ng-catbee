import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a string to kebab-case.
 *
 * @example
 * ```html
 * {{ 'helloWorld' | kebabCase }}
 * <!-- Output: "hello-world" -->
 *
 * {{ 'Hello World' | kebabCase }}
 * <!-- Output: "hello-world" -->
 *
 * {{ 'hello_world' | kebabCase }}
 * <!-- Output: "hello-world" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'kebabCase',
  standalone: true
})
export class KebabCasePipe implements PipeTransform {
  /**
   * Converts the input string to kebab-case.
   *
   * @param value - The string to convert
   * @returns The kebab-case string
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}
