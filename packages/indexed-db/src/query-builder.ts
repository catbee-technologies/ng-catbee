import { Observable, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CatbeeIndexedDBService } from './indexed-db.service';
import { DBMode, QueryOperator } from './indexed-db.types';

/**
 * Values that can be compared in IndexedDB filter operations.
 */
type ComparableValue = string | number | boolean | Date | null | undefined;

/**
 * Sorting direction for IndexedDB queries.
 */
type SortDirection = 'asc' | 'desc';

/**
 * Internal structure representing a filter condition.
 *
 * @template T Schema of the object stored in IndexedDB
 */
interface Filter<T> {
  /** Field to apply the comparison against */
  field: keyof T & string;
  /** Comparison operation */
  operator: QueryOperator;
  /** Value to compare the target field to */
  value: ComparableValue;
}

/**
 * Fluent Query Builder for IndexedDB
 *
 * Provides a chainable interface to filter, sort, limit & offset IndexedDB results,
 * returning results as an observable sequence. Works with both normal
 * cursor scans and index-based cursors when `orderBy()` is used.
 *
 * @example Basic usage
 * ```ts
 * const users$ = new QueryBuilder<User>(db, "users")
 *   .where("age", ">", 18)
 *   .orderBy("name", "asc")
 *   .limit(20)
 *   .execute();
 *
 * users$.subscribe(list => console.log(list));
 * ```
 *
 * @template T Type of object stored in IndexedDB
 * @public
 */
export class QueryBuilder<T> {
  /** List of applied filter conditions */
  private filters: Filter<T>[] = [];
  /** Field name to use for sorting */
  private sortField?: keyof T & string;
  /** Sort order (default: ascending) */
  private sortDirection: SortDirection = 'asc';
  /** Maximum rows allowed */
  private limitCount?: number;
  /** Rows to skip first (default 0) */
  private offsetCount = 0;

  /**
   * @param db Instance of CatbeeIndexedDBService
   * @param storeName Object-store name inside IndexedDB
   */
  constructor(
    private db: CatbeeIndexedDBService,
    private storeName: string
  ) {}

  /**
   * Adds a filter condition to the query.
   * Can be chained multiple times.
   *
   * @example
   * ```ts
   * query.where("age", ">=", 21).where("active", "=", true);
   * ```
   *
   * @param field Key of object to filter (`keyof T`)
   * @param operator Comparison operator
   * @param value Value to evaluate against
   * @returns `this` for chaining
   */
  where<K extends keyof T & string>(field: K, operator: QueryOperator, value: ComparableValue): this {
    this.filters.push({ field, operator, value } as Filter<T>);
    return this;
  }

  /**
   * Sort query results by a store field.
   * Internally enables index-cursor lookup if an index exists.
   *
   * @example
   * ```ts
   * query.orderBy("createdAt", "desc");
   * ```
   *
   * @param field Field to sort by
   * @param direction Optional sorting direction (`asc` by default)
   * @returns `this` for chaining
   */
  orderBy(field: keyof T & string, direction: SortDirection = 'asc'): this {
    this.sortField = field;
    this.sortDirection = direction;
    return this;
  }

  /**
   * Restrict the number of returned results.
   *
   * @example
   * ```ts
   * query.limit(5); // return only 5 results
   * ```
   *
   * @param count Maximum number of items (must be > 0)
   * @returns `this` for chaining
   * @throws If count ≤ 0
   */
  limit(count: number): this {
    if (count <= 0) throw new Error('Limit count must be greater than zero');
    this.limitCount = count;
    return this;
  }

  /**
   * Skip the first `count` results.
   * Useful for pagination.
   *
   * @example
   * ```ts
   * query.offset(10).limit(10); // Page 2
   * ```
   *
   * @param count Number of items to skip
   * @returns `this` for chaining
   * @throws If negative value supplied
   */
  offset(count: number): this {
    if (count < 0) throw new Error('Offset count cannot be negative');
    this.offsetCount = count;
    return this;
  }

  /**
   * Create a copy of the current query.
   * Useful when reusing an existing query as a template for further modifications.
   *
   * @example
   * ```ts
   * const adults = query.copy().where("age", ">", 18);
   * const minors = query.copy().where("age", "<", 18);
   * ```
   *
   * @returns New instance with all query settings cloned
   */
  copy(): QueryBuilder<T> {
    const clone = new QueryBuilder<T>(this.db, this.storeName);
    clone.filters = [...this.filters];
    clone.sortField = this.sortField;
    clone.sortDirection = this.sortDirection;
    clone.limitCount = this.limitCount;
    clone.offsetCount = this.offsetCount;
    return clone;
  }

  /**
   * Execute the built query.
   * Reads sequentially using IndexedDB cursors and applies filters, pagination,
   * and optional index-sorting when specified.
   *
   * @returns Observable resolving to `T[]` results list
   */
  execute(): Observable<T[]> {
    const useIndex = this.sortField ? String(this.sortField) : undefined;
    const direction: IDBCursorDirection = this.sortDirection === 'desc' ? 'prev' : 'next';

    return new Observable<T[]>(observer => {
      const results: T[] = [];
      let skipped = 0;
      let collected = 0;
      const stop$ = new Subject<void>();

      // Use index cursor if sorting is declared
      const cursor$ = useIndex
        ? this.db.openCursorByIndex<T>({ storeName: this.storeName, indexName: useIndex, direction })
        : this.db.openCursor<T>({ storeName: this.storeName, direction, mode: DBMode.ReadOnly });

      const sub = cursor$
        .pipe(
          finalize(() => stop$.complete()),
          takeUntil(stop$)
        )
        .subscribe({
          next: cursor => {
            const value = cursor.value as T;

            if (!this.applyFilters(value)) return cursor.continue();
            if (this.offsetCount > 0 && skipped++ < this.offsetCount) return cursor.continue();

            results.push(value);

            if (this.limitCount !== undefined && ++collected >= this.limitCount) {
              stop$.next();
              observer.next(results);
              observer.complete();
              return;
            }

            cursor.continue();
          },
          error: err => observer.error(err),
          complete: () => {
            observer.next(results);
            observer.complete();
          }
        });

      return () => sub.unsubscribe();
    });
  }

  /**
   * Applies all registered filters to a record.
   *
   * @param item Item to validate
   * @returns `true` if record passes all filters, otherwise `false`
   * @internal
   */
  private applyFilters(item: T): boolean {
    return this.filters.every(filter => {
      const fieldValue = item[filter.field];
      const filterValue = filter.value;

      // null / undefined equality logic
      if (filter.operator === '=') return fieldValue === filterValue;
      if (filter.operator === '!=') return fieldValue !== filterValue;
      if (fieldValue === null || fieldValue === undefined || filterValue === null || filterValue === undefined)
        return false;

      switch (filter.operator) {
        case '>':
          return fieldValue > filterValue;
        case '<':
          return fieldValue < filterValue;
        case '>=':
          return fieldValue >= filterValue;
        case '<=':
          return fieldValue <= filterValue;
        default:
          console.warn(`[QueryBuilder] Unknown operator: ${filter.operator}`);
          return false;
      }
    });
  }
}
