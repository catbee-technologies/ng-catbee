import { Pipe, PipeTransform } from '@angular/core';

/**
 * Returns unique values from an array.
 *
 * @example
 * ```html
 * {{ [1, 2, 2, 3, 3, 3] | unique }}
 * <!-- Output: [1, 2, 3] -->
 *
 * {{ users | unique:'email' }}
 * <!-- Returns users with unique email addresses -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'unique',
  standalone: true,
  pure: false
})
export class UniquePipe implements PipeTransform {
  /**
   * Filters array to unique values.
   *
   * @param items - Array to filter
   * @param property - Optional property name for objects
   * @returns Array with unique values
   */
  transform<T>(items: T[] | null | undefined, property?: string): T[] {
    if (!items) return [];

    if (!property) {
      return [...new Set(items)];
    }

    const seen = new Set();
    return items.filter(item => {
      const value = this.getNestedProperty(item, property);
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  private getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}
