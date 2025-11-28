import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts a property from each object in an array.
 *
 * @example
 * ```html
 * {{ users | pluck:'name' }}
 * <!-- Output: ['John', 'Jane', 'Bob'] -->
 *
 * {{ users | pluck:'address.city' }}
 * <!-- Output: ['New York', 'London', 'Paris'] -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'pluck',
  standalone: true
})
export class PluckPipe implements PipeTransform {
  /**
   * Plucks a property from each object.
   *
   * @param items - Array of objects
   * @param property - Property path to extract
   * @returns Array of extracted values
   */
  transform<T>(items: T[] | null | undefined, property: string): unknown[] {
    if (!items || !property) return [];

    return items.map(item => this.getNestedProperty(item, property));
  }

  private getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}
