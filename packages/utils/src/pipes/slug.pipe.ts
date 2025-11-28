import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a string to a URL-friendly slug.
 *
 * @example
 * ```html
 * {{ 'Hello World!' | slug }}
 * <!-- Output: "hello-world" -->
 *
 * {{ 'TypeScript & Angular' | slug }}
 * <!-- Output: "typescript-angular" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'slug',
  standalone: true
})
export class SlugPipe implements PipeTransform {
  /**
   * Converts the input string to a URL-friendly slug.
   *
   * @param value - The string to convert
   * @returns The slug string
   */
  transform(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}
