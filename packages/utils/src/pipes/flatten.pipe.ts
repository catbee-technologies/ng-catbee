import { Pipe, PipeTransform } from '@angular/core';

/**
 * Flattens a nested array into a single-level array.
 *
 * @example
 * ```html
 * {{ [[1, 2], [3, 4]] | flatten }}
 * <!-- Output: [1, 2, 3, 4] -->
 *
 * {{ [[1, [2, 3]], [4, [5, 6]]] | flatten:true }}
 * <!-- Output: [1, 2, 3, 4, 5, 6] (deep flatten) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'flatten',
  standalone: true
})
export class FlattenPipe implements PipeTransform {
  /**
   * Flattens a nested array.
   *
   * @param items - Array to flatten
   * @param deep - If true, flattens recursively
   * @returns Flattened array
   */
  transform<T>(items: T[] | null | undefined, deep = false): T[] {
    if (!items) return [];

    if (deep) {
      return this.deepFlatten(items);
    }

    return Array.isArray(items) ? (items.flat(1) as T[]) : [];
  }

  private deepFlatten<T>(arr: T[]): T[] {
    return arr.reduce((acc: T[], val: T) => {
      return acc.concat(Array.isArray(val) ? this.deepFlatten(val) : val);
    }, [] as T[]);
  }
}
