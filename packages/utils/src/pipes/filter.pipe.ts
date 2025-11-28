import { Pipe, PipeTransform } from '@angular/core';

/**
 * Filters an array based on a predicate function or property match.
 *
 * @example
 * ```html
 * <!-- Filter by property value -->
 * {{ users | filter:'active':true }}
 * <!-- Returns users where user.active === true -->
 *
 * <!-- Filter by search term (searches all string properties) -->
 * {{ users | filter:'search':'john' }}
 * <!-- Returns users where any string property contains 'john' -->
 *
 * <!-- Filter by nested property -->
 * {{ users | filter:'address.city':'New York' }}
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'filter',
  standalone: true,
  pure: false
})
export class FilterPipe implements PipeTransform {
  /**
   * Filters an array based on criteria.
   *
   * @param items - Array to filter
   * @param property - Property name or 'search' for full-text search
   * @param value - Value to match
   * @returns Filtered array
   */
  transform<T>(items: T[] | null | undefined, property: string, value: unknown): T[] {
    if (!items || !property) return items || [];

    if (property === 'search' && typeof value === 'string') {
      return this.searchFilter(items, value);
    }

    return items.filter(item => this.getNestedProperty(item, property) === value);
  }

  private searchFilter<T>(items: T[], searchTerm: string): T[] {
    const term = searchTerm.toLowerCase();

    return items.filter(item => {
      const values = Object.values(item as object);
      return values.some(val => {
        if (typeof val === 'string') {
          return val.toLowerCase().includes(term);
        }
        if (typeof val === 'number') {
          return val.toString().includes(term);
        }
        return false;
      });
    });
  }

  private getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}
