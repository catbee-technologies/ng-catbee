import { Pipe, PipeTransform } from '@angular/core';

/**
 * Groups an array of objects by a property value.
 *
 * @example
 * ```html
 * {{ users | groupBy:'role' }}
 * <!-- Output: { admin: [...], user: [...] } -->
 *
 * <!-- Use with keyvalue pipe to iterate -->
 * <div *ngFor="let group of users | groupBy:'role' | keyvalue">
 *   <h3>{{ group.key }}</h3>
 *   <div *ngFor="let user of group.value">{{ user.name }}</div>
 * </div>
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'groupBy',
  standalone: true,
  pure: false
})
export class GroupByPipe implements PipeTransform {
  /**
   * Groups an array by a property.
   *
   * @param items - Array to group
   * @param property - Property name to group by
   * @returns Object with grouped items
   */
  transform<T>(items: T[] | null | undefined, property: string): Record<string, T[]> {
    if (!items || !property) return {};

    return items.reduce(
      (groups, item) => {
        const key = String(this.getNestedProperty(item, property) ?? 'undefined');

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }

  private getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
  }
}
