import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, of, Subject, BehaviorSubject, firstValueFrom, EMPTY } from 'rxjs';
import { map, switchMap, catchError, tap, shareReplay } from 'rxjs/operators';
import { CATBEE_INDEXED_DB_CONFIG } from './indexed-db.config';
import {
  CatbeeIDBCursorWithValue,
  DBMode,
  CatbeeIndexedDBConfig,
  IndexKey,
  ObjectStoreMeta,
  WithID,
  DatabaseEvent
} from './indexed-db.types';
import { QueryBuilder } from './query-builder';

/**
 * Comprehensive IndexedDB service with full CRUD operations and advanced features.
 *
 * This service provides a complete wrapper around the IndexedDB API with RxJS observables,
 * TypeScript support, SSR safety, and advanced features like bulk operations, cursors, and migrations.
 *
 * @example
 * ```typescript
 * // Configure in app.config.ts
 * import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeIndexedDB({
 *       indexedDb: {
 *         name: 'MyAppDB',
 *         version: 1,
 *         objectStoresMeta: [
 *           {
 *             store: 'users',
 *             storeConfig: { keyPath: 'id', autoIncrement: true },
 *             storeSchema: [
 *               { name: 'email', keypath: 'email', options: { unique: true } },
 *               { name: 'name', keypath: 'name', options: { unique: false } }
 *             ]
 *           }
 *         ]
 *       }
 *     })
 *   ]
 * };
 *
 * // Use in component
 * constructor(private db: CatbeeIndexedDBService) {}
 *
 * addUser() {
 *   this.db.add('users', { email: 'john@example.com', name: 'John' })
 *     .subscribe(result => console.log('User added:', result));
 * }
 *
 * getUsers() {
 *   this.db.getAll('users').subscribe(users => console.log(users));
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class CatbeeIndexedDBService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalConfig = inject(CATBEE_INDEXED_DB_CONFIG, { optional: true });
  private dbConfig: CatbeeIndexedDBConfig | null = null;
  private database: IDBDatabase | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes default
  private cacheEnabled = false;
  private readonly events$ = new Subject<DatabaseEvent>();
  private readonly dbState$ = new BehaviorSubject<'closed' | 'opening' | 'open' | 'error'>('closed');

  /**
   * Observable stream of database events (add, update, delete, clear).
   * Subscribe to track all database changes.
   */
  readonly events = this.events$.asObservable();

  /**
   * Observable stream of database connection state.
   */
  readonly dbState = this.dbState$.asObservable();

  constructor() {
    if (this.globalConfig) {
      this.dbConfig = {
        version: 1,
        ...this.globalConfig
      };
    }
  }

  /**
   * Initializes the database with the provided configuration.
   *
   * @param config - Database configuration.
   * @returns Observable that completes when database is ready.
   *
   * @example
   * ```typescript
   * this.db.initialize({
   *   name: 'MyDB',
   *   version: 1,
   *   objectStoresMeta: [...]
   * }).subscribe(() => console.log('DB Ready'));
   * ```
   */
  initialize(config: CatbeeIndexedDBConfig): Observable<void> {
    this.dbConfig = { version: 1, ...config };

    // Configure cache settings
    if (config.cache) {
      this.cacheEnabled = config.cache.enabled ?? false;
      this.cacheExpiry = (config.cache.expirySeconds ?? 300) * 1000; // Convert to milliseconds
    }

    return this.openDatabase();
  }

  /**
   * Opens the database connection with state management and error handling.
   */
  private openDatabase(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.dbState$.next('open');
      return of(void 0);
    }

    if (!this.dbConfig) {
      this.dbState$.next('error');
      return throwError(() => new Error('Database not configured. Call initialize() first.'));
    }

    this.dbState$.next('opening');

    return new Observable(observer => {
      const request = window.indexedDB.open(this.dbConfig!.name, this.dbConfig!.version);

      request.onerror = () => {
        this.dbState$.next('error');
        const error = new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`);
        console.error('[IndexedDB] Open error:', error);
        observer.error(error);
      };

      request.onsuccess = () => {
        this.database = request.result;
        this.dbState$.next('open');

        this.database.onerror = event => {
          console.error('[IndexedDB] Database error:', event);
        };

        observer.next();
        observer.complete();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = (event.target as IDBOpenDBRequest).transaction!;
        const oldV = event.oldVersion ?? 0;
        const newV = event.newVersion ?? this.dbConfig!.version ?? 1;

        try {
          this.createStores(db, tx);

          if (this.dbConfig!.migrationFactory) {
            const migrations = this.dbConfig!.migrationFactory();
            for (let v = oldV + 1; v <= newV; v++) {
              if (migrations[v]) {
                console.log(`[IndexedDB] Running migration → v${v}`);
                migrations[v](db, tx);
              }
            }
          }
        } catch (err) {
          console.error('[IndexedDB] Upgrade migration failed:', err);
          throw err;
        }
      };

      request.onblocked = () => {
        console.warn('[IndexedDB] Database upgrade blocked. Close other tabs using this database.');
      };
    });
  }

  /**
   * Creates object stores based on configuration.
   */
  private createStores(db: IDBDatabase, _transaction: IDBTransaction): void {
    if (!this.dbConfig) return;

    this.dbConfig.objectStoresMeta.forEach((storeMeta: ObjectStoreMeta) => {
      if (!db.objectStoreNames.contains(storeMeta.store)) {
        const objectStore = db.createObjectStore(storeMeta.store, storeMeta.storeConfig);

        storeMeta.storeSchema.forEach(schema => {
          objectStore.createIndex(schema.name, schema.keypath, schema.options);
        });
      }
    });
  }

  /**
   * Ensures database is open before operations.
   */
  private ensureDatabase(): Observable<IDBDatabase | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    if (this.database) {
      return of(this.database);
    }

    return this.openDatabase().pipe(map(() => this.database));
  }

  /**
   * Gets a transaction for the specified store.
   */
  private getTransaction(storeName: string, mode: DBMode): Observable<IDBObjectStore> {
    return this.ensureDatabase().pipe(
      switchMap(db => {
        if (!db) {
          return EMPTY;
        }
        const transaction = db.transaction([storeName], mode);
        transaction.onerror = event => {
          console.error(`[IndexedDB] Transaction error on ${storeName}:`, event);
        };
        return of(transaction.objectStore(storeName));
      }),
      catchError(error => {
        console.error(`[IndexedDB] Failed to get transaction for ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clears cache for a specific store or all stores.
   */
  private clearCache(storeName?: string): void {
    if (storeName) {
      const prefix = `${this.dbConfig?.name}:${this.dbConfig?.version}:${storeName}:`;
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Emits a database event.
   */
  private emitEvent(event: DatabaseEvent): void {
    this.events$.next(event);
  }

  /**
   * Adds a new entry to the store.
   *
   * @param storeName - The name of the store.
   * @param value - The value to add.
   * @param key - Optional key for the entry.
   * @returns Observable with the added item including its ID.
   *
   * @example
   * ```typescript
   * this.db.add('users', { name: 'John', email: 'john@example.com' })
   *   .subscribe(user => console.log('Added user:', user));
   * ```
   */
  add<T>(storeName: string, value: T, key?: unknown): Observable<T & WithID> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store => {
        const request = key ? store.add(value, key as IDBValidKey) : store.add(value);
        return this.wrapRequest(request).pipe(
          map(result => {
            const res = { ...value, id: result as number } as T & WithID;
            this.clearCache(storeName);
            this.emitEvent({ type: 'add', storeName, data: res });
            return res;
          })
        );
      }),
      catchError(error => {
        console.error(`[IndexedDB] Add operation failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Adds multiple entries to the store.
   *
   * @param storeName - The name of the store.
   * @param values - Array of values to add.
   * @returns Observable with array of generated keys.
   *
   * @example
   * ```typescript
   * this.db.bulkAdd('users', [
   *   { name: 'John', email: 'john@example.com' },
   *   { name: 'Jane', email: 'jane@example.com' }
   * ]).subscribe(keys => console.log('Added keys:', keys));
   * ```
   */
  bulkAdd<T>(storeName: string, values: (T & { key?: unknown })[]): Observable<number[]> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store => {
        return new Observable<number[]>(observer => {
          const keys: number[] = [];
          let completed = 0;

          if (values.length === 0) {
            observer.next(keys);
            observer.complete();
            return;
          }

          values.forEach((value, index) => {
            const { key, ...item } = value;
            const request = key ? store.add(item, key as IDBValidKey) : store.add(item);

            request.onsuccess = () => {
              keys[index] = request.result as number;
              completed++;
              if (completed === values.length) {
                this.clearCache(storeName);
                this.emitEvent({ type: 'bulkAdd', storeName, data: { count: values.length, keys } });
                observer.next(keys);
                observer.complete();
              }
            };

            request.onerror = () => {
              observer.error(request.error);
            };
          });
        });
      })
    );
  }

  /**
   * Gets an entry by its key.
   *
   * @param storeName - The name of the store.
   * @param key - The entry key.
   * @returns Observable with the entry.
   *
   * @example
   * ```typescript
   * this.db.getByKey('users', 1)
   *   .subscribe(user => console.log('User:', user));
   * ```
   */
  getByKey<T>(storeName: string, key: IDBValidKey): Observable<T> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => this.wrapRequest(store.get(key)).pipe(map(result => result as T)))
    );
  }

  /**
   * Gets multiple entries by their keys.
   *
   * @param storeName - The name of the store.
   * @param keys - Array of keys to retrieve.
   * @returns Observable with array of entries.
   */
  bulkGet<T>(storeName: string, keys: IDBValidKey[]): Observable<T[]> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => {
        if (keys.length === 0) {
          return of([]);
        }
        const requests = keys.map(key => this.wrapRequest(store.get(key)).pipe(map(result => result as T)));
        return requests.length
          ? requests.length === 1
            ? requests[0].pipe(map(result => [result]))
            : requests.reduce(
                (acc, obs) => acc.pipe(switchMap(arr => obs.pipe(map(res => [...arr, res])))),
                of([] as T[])
              )
          : of([]);
      })
    );
  }

  /**
   * Gets an entry by ID (alias for getByKey).
   */
  getByID<T>(storeName: string, id: string | number): Observable<T> {
    return this.getByKey<T>(storeName, id);
  }

  /**
   * Gets entries by index.
   *
   * @param storeName - The name of the store.
   * @param indexName - The index name.
   * @param key - The index key value.
   * @returns Observable with the matching entry.
   */
  getByIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Observable<T> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => {
        return new Observable<T>(observer => {
          const index = store.index(indexName);
          const request = index.get(key);

          request.onsuccess = () => {
            observer.next(request.result as T);
            observer.complete();
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Gets all entries from a store.
   *
   * @param storeName - The name of the store.
   * @returns Observable with array of all entries.
   *
   * @example
   * ```typescript
   * this.db.getAll('users')
   *   .subscribe(users => console.log('All users:', users));
   * ```
   */
  getAll<T>(storeName: string): Observable<T[]> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => this.wrapRequest(store.getAll()).pipe(map(result => result as T[])))
    );
  }

  /**
   * Updates an entry in the store.
   *
   * @param storeName - The name of the store.
   * @param value - The updated value.
   * @returns Observable with the updated entry.
   *
   * @example
   * ```typescript
   * this.db.update('users', { id: 1, name: 'John Updated' })
   *   .subscribe(user => console.log('Updated:', user));
   * ```
   */
  update<T>(storeName: string, value: T): Observable<T> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store =>
        this.wrapRequest(store.put(value)).pipe(
          map(() => {
            this.clearCache(storeName);
            this.emitEvent({ type: 'update', storeName, data: value });
            return value;
          })
        )
      ),
      catchError(error => {
        console.error(`[IndexedDB] Update operation failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates multiple entries in the store.
   *
   * @param storeName - The name of the store.
   * @param items - Array of items to update.
   * @returns Observable with the last updated key.
   */
  bulkPut<T>(storeName: string, items: T[]): Observable<IDBValidKey> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store => {
        return new Observable<IDBValidKey>(observer => {
          if (items.length === 0) {
            observer.complete();
            return;
          }

          let lastKey: IDBValidKey;
          let completed = 0;

          items.forEach(item => {
            const request = store.put(item);

            request.onsuccess = () => {
              lastKey = request.result;
              completed++;
              if (completed === items.length) {
                this.clearCache(storeName);
                this.emitEvent({ type: 'bulkUpdate', storeName, data: { count: items.length } });
                observer.next(lastKey);
                observer.complete();
              }
            };

            request.onerror = () => {
              observer.error(request.error);
            };
          });
        });
      })
    );
  }

  /**
   * Deletes an entry and returns remaining entries.
   *
   * @param storeName - The name of the store.
   * @param query - The key or key range to delete.
   * @returns Observable with remaining entries.
   */
  delete<T>(storeName: string, query: IDBValidKey | IDBKeyRange): Observable<T[]> {
    return this.deleteByKey(storeName, query).pipe(switchMap(() => this.getAll<T>(storeName)));
  }

  /**
   * Deletes an entry by key.
   *
   * @param storeName - The name of the store.
   * @param query - The key or key range to delete.
   * @returns Observable that completes when deletion is done.
   *
   * @example
   * ```typescript
   * this.db.deleteByKey('users', 1)
   *   .subscribe(() => console.log('User deleted'));
   * ```
   */
  deleteByKey(storeName: string, query: IDBValidKey | IDBKeyRange): Observable<void> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store =>
        this.wrapRequest(store.delete(query)).pipe(
          map(() => {
            this.clearCache(storeName);
            this.emitEvent({ type: 'delete', storeName, data: { key: query } });
          })
        )
      ),
      catchError(error => {
        console.error(`[IndexedDB] Delete operation failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Deletes multiple entries by their keys.
   *
   * @param storeName - The name of the store.
   * @param keys - Array of keys to delete.
   * @returns Observable with the count of remaining entries.
   */
  bulkDelete(storeName: string, keys: IDBValidKey[]): Observable<number> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store => {
        return new Observable<number>(observer => {
          if (keys.length === 0) {
            const countRequest = store.count();
            countRequest.onsuccess = () => {
              observer.next(countRequest.result);
              observer.complete();
            };
            countRequest.onerror = () => {
              observer.error(countRequest.error);
            };
            return;
          }

          let completed = 0;

          keys.forEach(key => {
            const request = store.delete(key);

            request.onsuccess = () => {
              completed++;
              if (completed === keys.length) {
                const countRequest = store.count();
                countRequest.onsuccess = () => {
                  this.clearCache(storeName);
                  this.emitEvent({ type: 'bulkDelete', storeName, data: { count: keys.length, keys } });
                  observer.next(countRequest.result);
                  observer.complete();
                };
              }
            };

            request.onerror = () => {
              observer.error(request.error);
            };
          });
        });
      })
    );
  }

  /**
   * Clears all entries from a store.
   *
   * @param storeName - The name of the store.
   * @returns Observable that completes when store is cleared.
   *
   * @example
   * ```typescript
   * this.db.clear('users')
   *   .subscribe(() => console.log('Store cleared'));
   * ```
   */
  clear(storeName: string): Observable<void> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store =>
        this.wrapRequest(store.clear()).pipe(
          map(() => {
            this.clearCache(storeName);
            this.emitEvent({ type: 'clear', storeName });
          })
        )
      ),
      catchError(error => {
        console.error(`[IndexedDB] Clear operation failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Counts entries in a store.
   *
   * @param storeName - The name of the store.
   * @param query - Optional key range to count.
   * @returns Observable with the count.
   *
   * @example
   * ```typescript
   * this.db.count('users')
   *   .subscribe(count => console.log('Total users:', count));
   * ```
   */
  count(storeName: string, query?: IDBValidKey | IDBKeyRange): Observable<number> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => this.wrapRequest(query ? store.count(query) : store.count()))
    );
  }

  /**
   * Gets the current database version.
   *
   * @returns Observable with the version number.
   */
  getDatabaseVersion(): Observable<number | string> {
    return this.ensureDatabase().pipe(
      map(db => {
        if (!db) {
          return this.dbConfig?.version ?? 1;
        }
        return db.version;
      })
    );
  }

  /**
   * Deletes the entire database.
   *
   * @returns Observable that completes when database is deleted.
   *
   * @example
   * ```typescript
   * this.db.deleteDatabase()
   *   .subscribe(() => console.log('Database deleted'));
   * ```
   */
  deleteDatabase(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(void 0);
    }

    if (!this.dbConfig) {
      return throwError(() => new Error('Database not available'));
    }

    if (this.database) {
      this.database.close();
      this.database = null;
    }

    const request = window.indexedDB.deleteDatabase(this.dbConfig!.name);
    return this.wrapRequest(request).pipe(map(() => void 0));
  }

  /**
   * Opens a cursor for iterating over entries.
   *
   * @param options - Cursor options.
   * @returns Observable that emits for each cursor position.
   *
   * @example
   * ```typescript
   * this.db.openCursor({
   *   storeName: 'users',
   *   mode: DBMode.ReadOnly
   * }).subscribe(cursor => {
   *   console.log('Entry:', cursor.value);
   *   cursor.continue();
   * });
   * ```
   */
  openCursor<V = unknown, P extends IDBValidKey = IDBValidKey, K extends IDBValidKey = IDBValidKey>(options: {
    storeName: string;
    query?: IDBValidKey | IDBKeyRange | null;
    direction?: IDBCursorDirection;
    mode: DBMode;
  }): Observable<CatbeeIDBCursorWithValue<V, P, K>> {
    return this.getTransaction(options.storeName, options.mode).pipe(
      switchMap(store => {
        return new Observable<CatbeeIDBCursorWithValue<V, P, K>>(observer => {
          const request = store.openCursor(options.query, options.direction);

          request.onsuccess = () => {
            const cursor = request.result as CatbeeIDBCursorWithValue<V, P, K>;
            if (cursor) {
              observer.next(cursor);
            } else {
              observer.complete();
            }
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Opens a cursor by index.
   *
   * @param options - Cursor options including index name.
   * @returns Observable that emits for each cursor position.
   */
  openCursorByIndex<V, P extends IDBValidKey = IDBValidKey, K extends IDBValidKey = IDBValidKey>(options: {
    storeName: string;
    indexName: string;
    query?: IDBValidKey | IDBKeyRange | null;
    direction?: IDBCursorDirection;
    mode?: DBMode;
  }): Observable<CatbeeIDBCursorWithValue<V, P, K>> {
    return this.getTransaction(options.storeName, options.mode || DBMode.ReadOnly).pipe(
      switchMap(store => {
        return new Observable<CatbeeIDBCursorWithValue<V, P, K>>(observer => {
          const index = store.index(options.indexName);
          const request = index.openCursor(options.query, options.direction);

          request.onsuccess = () => {
            const cursor = request.result as CatbeeIDBCursorWithValue<V, P, K>;
            if (cursor) {
              observer.next(cursor);
            } else {
              observer.complete();
            }
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Gets all entries by an index.
   *
   * @param storeName - The name of the store.
   * @param indexName - The index name.
   * @param query - Optional key range query.
   * @param direction - Cursor direction.
   * @returns Observable with array of matching entries.
   *
   * @example
   * ```typescript
   * this.db.getAllByIndex('users', 'email', 'john@example.com')
   *   .subscribe(users => console.log('Users with email:', users));
   * ```
   */
  getAllByIndex<T>(
    storeName: string,
    indexName: string,
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection
  ): Observable<T[]> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => {
        return new Observable<T[]>(observer => {
          const index = store.index(indexName);
          const results: T[] = [];
          const request = index.openCursor(query, direction);

          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              results.push(cursor.value as T);
              cursor.continue();
            } else {
              observer.next(results);
              observer.complete();
            }
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Deletes all entries matching an index query.
   *
   * @param storeName - The name of the store.
   * @param indexName - The index name.
   * @param query - Optional key range query.
   * @param direction - Cursor direction.
   * @returns Observable that completes when deletion is done.
   */
  deleteAllByIndex(
    storeName: string,
    indexName: string,
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection
  ): Observable<void> {
    return this.getTransaction(storeName, DBMode.ReadWrite).pipe(
      switchMap(store => {
        return new Observable<void>(observer => {
          const index = store.index(indexName);
          const request = index.openCursor(query, direction);

          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              observer.next();
              observer.complete();
            }
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Counts entries by index.
   *
   * @param storeName - The name of the store.
   * @param indexName - The index name.
   * @param query - Optional key range query.
   * @returns Observable with the count.
   */
  countByIndex(storeName: string, indexName: string, query?: IDBValidKey | IDBKeyRange): Observable<number> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => {
        return new Observable<number>(observer => {
          const index = store.index(indexName);
          const request = query ? index.count(query) : index.count();

          request.onsuccess = () => {
            observer.next(request.result);
            observer.complete();
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Gets all primary keys by an index.
   *
   * @param storeName - The name of the store.
   * @param indexName - The index name.
   * @param query - Optional key range query.
   * @param direction - Cursor direction.
   * @returns Observable with array of index keys.
   */
  getAllKeysByIndex<P extends IDBValidKey = IDBValidKey, K extends IDBValidKey = IDBValidKey>(
    storeName: string,
    indexName: string,
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection
  ): Observable<IndexKey<P, K>[]> {
    return this.getTransaction(storeName, DBMode.ReadOnly).pipe(
      switchMap(store => {
        return new Observable<IndexKey<P, K>[]>(observer => {
          const index = store.index(indexName);
          const results: IndexKey<P, K>[] = [];
          const request = index.openCursor(query, direction);

          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              results.push({
                primaryKey: cursor.primaryKey as P,
                key: cursor.key as K
              });
              cursor.continue();
            } else {
              observer.next(results);
              observer.complete();
            }
          };

          request.onerror = () => {
            observer.error(request.error);
          };
        });
      })
    );
  }

  /**
   * Creates a new object store dynamically.
   *
   * @param storeSchema - The store schema to create.
   * @param migrationFactory - Optional migration factory.
   * @returns Promise that resolves when store is created.
   */
  async createObjectStore(
    storeSchema: ObjectStoreMeta,
    migrationFactory?: () => Record<number, (db: IDBDatabase, transaction: IDBTransaction) => void>
  ): Promise<void> {
    if (!this.dbConfig) {
      throw new Error('Database not configured');
    }

    this.dbConfig.objectStoresMeta.push(storeSchema);
    this.dbConfig.version = (this.dbConfig.version || 1) + 1;
    if (migrationFactory) {
      this.dbConfig.migrationFactory = migrationFactory;
    }

    if (this.database) {
      this.database.close();
      this.database = null;
    }

    return firstValueFrom(this.openDatabase());
  }

  /**
   * Creates a dynamic object store without incrementing version.
   *
   * @param storeSchema - The store schema to create.
   * @param migrationFactory - Optional migration factory.
   * @returns Promise that resolves when store is created.
   */
  async createDynamicObjectStore(
    storeSchema: ObjectStoreMeta,
    migrationFactory?: () => Record<number, (db: IDBDatabase, transaction: IDBTransaction) => void>
  ): Promise<void> {
    if (!this.dbConfig) {
      throw new Error('Database not configured');
    }

    const db = await firstValueFrom(this.ensureDatabase());
    if (db && !db.objectStoreNames.contains(storeSchema.store)) {
      return this.createObjectStore(storeSchema, migrationFactory);
    }
  }

  /**
   * Deletes an object store.
   *
   * @param storeName - The name of the store to delete.
   * @returns Observable that completes when store is deleted.
   */
  deleteObjectStore(storeName: string): Observable<void> {
    if (!this.dbConfig) {
      return throwError(() => new Error('Database not configured'));
    }

    this.dbConfig.version = (this.dbConfig.version || 1) + 1;

    if (this.database) {
      this.database.close();
      this.database = null;
    }

    if (!isPlatformBrowser(this.platformId)) {
      return of(void 0);
    }

    return new Observable<void>(observer => {
      const request = window.indexedDB.open(this.dbConfig!.name, this.dbConfig!.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        this.database = request.result;
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
  }

  /**
   * Gets all object store names in the database.
   *
   * @returns Observable with array of store names.
   */
  getAllObjectStoreNames(): Observable<string[]> {
    return this.ensureDatabase().pipe(
      map(db => {
        if (!db) {
          return this.dbConfig?.objectStoresMeta.map(meta => meta.store) ?? [];
        }
        return Array.from(db.objectStoreNames);
      })
    );
  }

  /**
   * Executes a transaction with multiple operations atomically.
   * All operations succeed or fail together.
   *
   * @param storeName - The name of the store.
   * @param operations - Function that receives the store and performs operations.
   * @returns Observable that completes when transaction is done.
   *
   * @example
   * ```typescript
   * this.db.transaction('users', DBMode.ReadWrite, (store) => {
   *   store.add({ name: 'User 1', email: 'user1@example.com' });
   *   store.add({ name: 'User 2', email: 'user2@example.com' });
   * }).subscribe(() => console.log('Transaction complete'));
   * ```
   */
  transaction<T = void>(
    storeName: string,
    mode: DBMode,
    operations: (store: IDBObjectStore) => T | Promise<T> | void
  ): Observable<T | void> {
    return this.ensureDatabase().pipe(
      switchMap(db => {
        if (!db) {
          return EMPTY;
        }

        return new Observable<T | void>(observer => {
          try {
            const transaction = db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            let result: T | void;

            transaction.oncomplete = () => {
              this.clearCache(storeName);
              observer.next(result);
              observer.complete();
            };

            transaction.onerror = () => {
              const error = new Error(
                `Transaction failed on ${storeName}: ${transaction.error?.message || 'Unknown error'}`
              );
              console.error('[IndexedDB]', error);
              observer.error(error);
            };

            transaction.onabort = () => {
              const error = new Error(`Transaction aborted on ${storeName}`);
              console.error('[IndexedDB]', error);
              observer.error(error);
            };

            try {
              const operationResult = operations(store);
              if (operationResult instanceof Promise) {
                operationResult.then(
                  value => {
                    result = value;
                  },
                  error => {
                    transaction.abort();
                    observer.error(error);
                  }
                );
              } else {
                result = operationResult;
              }
            } catch (error) {
              console.error('[IndexedDB] Transaction operation error:', error);
              transaction.abort();
              observer.error(error);
            }
          } catch (error) {
            console.error('[IndexedDB] Transaction setup error:', error);
            observer.error(error);
          }
        });
      }),
      catchError(error => {
        console.error(`[IndexedDB] Transaction setup failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Query builder for complex queries with filtering and sorting.
   *
   * @param storeName - The name of the store.
   * @returns QueryBuilder instance.
   *
   * @example
   * ```typescript
   * this.db.query('users')
   *   .where('role', '=', 'admin')
   *   .orderBy('name', 'asc')
   *   .limit(10)
   *   .execute()
   *   .subscribe(users => console.log('Admin users:', users));
   * ```
   */
  query<T>(storeName: string): QueryBuilder<T> {
    return new QueryBuilder<T>(this, storeName);
  }

  /**
   * Performs a batch of operations atomically.
   *
   * @param storeName - The name of the store.
   * @param operations - Array of operations to perform.
   * @returns Observable that completes when all operations are done.
   *
   * @example
   * ```typescript
   * this.db.batch('users', [
   *   { type: 'add', value: { name: 'User 1' } },
   *   { type: 'update', value: { id: 1, name: 'Updated' } },
   *   { type: 'delete', key: 2 }
   * ]).subscribe(() => console.log('Batch complete'));
   * ```
   */
  batch<T>(
    storeName: string,
    operations: (
      | { type: 'add'; value: T; key?: unknown }
      | { type: 'update'; value: T }
      | { type: 'delete'; key: IDBValidKey }
    )[]
  ): Observable<void> {
    return this.ensureDatabase().pipe(
      switchMap(db => {
        if (!db) {
          return EMPTY;
        }

        return new Observable<void>(observer => {
          try {
            const transaction = db.transaction([storeName], DBMode.ReadWrite);
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => {
              this.clearCache(storeName);
              this.emitEvent({ type: 'batch', storeName, data: { operations, count: operations.length } });
              observer.next();
              observer.complete();
            };

            transaction.onerror = () => {
              const error = new Error(
                `Batch operation failed on ${storeName}: ${transaction.error?.message || 'Unknown error'}`
              );
              console.error('[IndexedDB]', error);
              observer.error(error);
            };

            try {
              operations.forEach(op => {
                switch (op.type) {
                  case 'add':
                    if ('key' in op && op.key) {
                      store.add(op.value, op.key as IDBValidKey);
                    } else {
                      store.add(op.value);
                    }
                    break;
                  case 'update':
                    store.put(op.value);
                    break;
                  case 'delete':
                    store.delete(op.key);
                    break;
                }
              });
            } catch (error) {
              console.error('[IndexedDB] Batch operation error:', error);
              transaction.abort();
              observer.error(error);
            }
          } catch (error) {
            console.error('[IndexedDB] Batch setup error:', error);
            observer.error(error);
          }
        });
      }),
      catchError(error => {
        console.error(`[IndexedDB] Batch operation failed on ${storeName}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Exports all data from a store.
   *
   * @param storeName - The name of the store.
   * @returns Observable with all data.
   */
  export<T>(storeName: string): Observable<T[]> {
    return this.getAll<T>(storeName);
  }

  /**
   * Imports data into a store, replacing all existing data.
   *
   * @param storeName - The name of the store.
   * @param data - Array of data to import.
   * @returns Observable that completes when import is done.
   */
  import<T>(storeName: string, data: T[]): Observable<void> {
    return this.clear(storeName).pipe(
      switchMap(() => this.bulkAdd(storeName, data as (T & { key?: unknown })[])),
      map(() => void 0),
      tap(() => {
        this.emitEvent({ type: 'import', storeName, data: { count: data.length } });
      })
    );
  }

  /**
   * Gets cached data or fetches from database.
   *
   * @param storeName - The name of the store.
   * @param key - Cache key.
   * @param fetcher - Function to fetch data if not cached.
   * @returns Observable with cached or fresh data.
   */
  cached<T>(storeName: string, key: string, fetcher: () => Observable<T>): Observable<T> {
    // Skip caching if disabled or no config
    if (!this.dbConfig || !this.cacheEnabled) return fetcher();

    const cacheKey = `${this.dbConfig.name}:${this.dbConfig.version}:${storeName}:${key}`;

    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return of(cached.data as T);
    }

    return fetcher().pipe(
      tap(data => this.cache.set(cacheKey, { data, timestamp: Date.now() })),
      shareReplay(1)
    );
  }

  /**
   * Manually invalidates cache for a store.
   *
   * @param storeName - Optional store name. If not provided, clears all cache.
   */
  invalidateCache(storeName?: string): void {
    this.clearCache(storeName);
  }

  /**
   * Closes the database connection.
   */
  close(): void {
    if (this.database) {
      this.database.close();
      this.database = null;
      this.dbState$.next('closed');
      this.clearCache();
    }
  }

  private wrapRequest<T>(req: IDBRequest<T>): Observable<T> {
    return new Observable(observer => {
      req.onsuccess = () => {
        observer.next(req.result);
        observer.complete();
      };
      req.onerror = () => observer.error(req.error);
    });
  }
}

/**
 * Public alias for the `CatbeeIndexedDBService`.
 *
 * This export provides a stable, concise name for consumers of the Catbee
 * IndexedDB module while re-exporting the underlying full-featured service
 * without modification.
 *
 * @alias IndexedDBService
 * @see CatbeeIndexedDBService
 *
 * @example
 * ```ts
 * import { IndexedDBService } from '@ng-catbee/indexed-db';
 *
 * constructor(private db: IndexedDBService) {}
 *
 * this.db.getAll('users').subscribe(users => {
 *   console.log('Users:', users);
 * });
 * ```
 *
 * @public
 */
export const IndexedDBService = CatbeeIndexedDBService;
