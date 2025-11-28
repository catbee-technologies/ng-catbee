import { Pipe, PipeTransform } from '@angular/core';

/**
 * Splits an array into chunks of specified size.
 *
 * @example
 * ```html
 * {{ [1, 2, 3, 4, 5, 6] | chunk:2 }}
 * <!-- Output: [[1, 2], [3, 4], [5, 6]] -->
 *
 * <div *ngFor="let row of items | chunk:3">
 *   <span *ngFor="let item of row">{{ item }}</span>
 * </div>
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'chunk',
  standalone: true
})
export class ChunkPipe implements PipeTransform {
  /**
   * Splits array into chunks.
   *
   * @param items - Array to chunk
   * @param size - Chunk size
   * @returns Array of arrays (chunks)
   */
  transform<T>(items: T[] | null | undefined, size = 1): T[][] {
    if (!items || size < 1) return [];

    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }

    return chunks;
  }
}
