import { Pipe, PipeTransform } from '@angular/core';

/**
 * Sorts an array by a property or custom comparator.
 *
 * @example
 * ```html
 * <!-- Sort by property ascending -->
 * {{ users | sort:'name' }}
 *
 * <!-- Sort by property descending -->
 * {{ users | sort:'age':'desc' }}
 *
 * <!-- Sort by nested property -->
 * {{ users | sort:'address.city' }}
 *
 * <!-- Sort numbers -->
 * {{ [3, 1, 2] | sort }}
 * <!-- Output: [1, 2, 3] -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'sort',
  standalone: true,
  pure: false
})
export class SortPipe implements PipeTransform {
  /**
   * Sorts an array.
   *
   * @param items - Array to sort
   * @param property - Property name to sort by (optional for primitive arrays)
   * @param order - Sort order: 'asc' or 'desc' (default: 'asc')
   * @returns Sorted array
   */
  transform<T>(items: T[] | null | undefined, property?: string, order: 'asc' | 'desc' = 'asc'): T[] {
    if (!items || items.length <= 1) return items || [];

    const sorted = [...items];
    const multiplier = order === 'desc' ? -1 : 1;

    sorted.sort((a, b) => {
      const aVal: unknown = property ? this.getNestedProperty(a, property) : a;
      const bVal: unknown = property ? this.getNestedProperty(b, property) : b;

      // Handle null/undefined
      if (aVal == null) return 1 * multiplier;
      if (bVal == null) return -1 * multiplier;

      // String comparison (case-insensitive)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aLower = aVal.toLowerCase();
        const bLower = bVal.toLowerCase();
        if (aLower < bLower) return -1 * multiplier;
        if (aLower > bLower) return 1 * multiplier;
        return 0;
      }

      // Number/other comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      }

      // Fallback: convert to string and compare
      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return -1 * multiplier;
      if (aStr > bStr) return 1 * multiplier;
      return 0;
    });

    return sorted;
  }

  private getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}
