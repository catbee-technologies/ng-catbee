import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CATBEE_UTILS_CONFIG } from '@ng-catbee/utils/config';
import {
  CatbeeIDBCursorWithValue,
  DBMode,
  IndexedDBConfig,
  IndexKey,
  ObjectStoreMeta,
  WithID
} from '@ng-catbee/utils/types';

/**
 * Comprehensive IndexedDB service with full CRUD operations and advanced features.
 *
 * This service provides a complete wrapper around the IndexedDB API with RxJS observables,
 * TypeScript support, SSR safety, and advanced features like bulk operations, cursors, and migrations.
 *
 * @example
 * ```typescript
 * // Configure in app.config.ts
 * import { provideCatbeeUtils } from '@catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeUtils({
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
 * constructor(private db: IndexedDBService) {}
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
export class IndexedDBService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalConfig = inject(CATBEE_UTILS_CONFIG, { optional: true });
  private dbConfig: IndexedDBConfig | null = null;
  private database: IDBDatabase | null = null;

  constructor() {
    if (this.globalConfig?.indexedDb) {
      this.dbConfig = {
        version: 1,
        ...this.globalConfig.indexedDb
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
  initialize(config: IndexedDBConfig): Observable<void> {
    this.dbConfig = { version: 1, ...config };
    return this.openDatabase();
  }

  /**
   * Opens the database connection.
   */
  private openDatabase(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(void 0);
    }

    if (!this.dbConfig) {
      return throwError(() => new Error('Database not configured. Call initialize() first.'));
    }

    return new Observable(observer => {
      const request = window.indexedDB.open(this.dbConfig!.name, this.dbConfig!.version);

      request.onerror = () => {
        observer.error(request.error);
      };

      request.onsuccess = () => {
        this.database = request.result;
        observer.next();
        observer.complete();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;

        this.createStores(db, transaction);

        // Run migrations if provided
        if (this.dbConfig!.migrationFactory) {
          const migrations = this.dbConfig!.migrationFactory();
          if (migrations[event.newVersion!]) {
            migrations[event.newVersion!](db, transaction);
          }
        }
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

        // Create indexes
        storeMeta.storeSchema.forEach(schema => {
          objectStore.createIndex(schema.name, schema.keypath, schema.options);
        });
      }
    });
  }

  /**
   * Ensures database is open before operations.
   */
  private ensureDatabase(): Observable<IDBDatabase> {
    if (this.database) {
      return of(this.database);
    }

    return this.openDatabase().pipe(map(() => this.database!));
  }

  /**
   * Gets a transaction for the specified store.
   */
  private getTransaction(storeName: string, mode: DBMode): Observable<IDBObjectStore> {
    return this.ensureDatabase().pipe(
      map(db => {
        const transaction = db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
      })
    );
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<T & WithID>(observer => {
          const request = key ? store.add(value, key as IDBValidKey) : store.add(value);

          request.onsuccess = () => {
            observer.next({ ...value, id: request.result as number } as T & WithID);
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<number[]>(observer => {
          const keys: number[] = [];
          let completed = 0;

          values.forEach((value, index) => {
            const { key, ...item } = value;
            const request = key ? store.add(item, key as IDBValidKey) : store.add(item);

            request.onsuccess = () => {
              keys[index] = request.result as number;
              completed++;
              if (completed === values.length) {
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
      switchMap(store => {
        return new Observable<T>(observer => {
          const request = store.get(key);

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
   * Gets multiple entries by their keys.
   *
   * @param storeName - The name of the store.
   * @param keys - Array of keys to retrieve.
   * @returns Observable with array of entries.
   */
  bulkGet<T>(storeName: string, keys: IDBValidKey[]): Observable<T[]> {
    return this.getTransaction(storeName, DBMode.readonly).pipe(
      switchMap(store => {
        return new Observable<T[]>(observer => {
          const results: T[] = [];
          let completed = 0;

          keys.forEach((key, index) => {
            const request = store.get(key);

            request.onsuccess = () => {
              results[index] = request.result as T;
              completed++;
              if (completed === keys.length) {
                observer.next(results);
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
      switchMap(store => {
        return new Observable<T[]>(observer => {
          const request = store.getAll();

          request.onsuccess = () => {
            observer.next(request.result as T[]);
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<T>(observer => {
          const request = store.put(value);

          request.onsuccess = () => {
            observer.next(value);
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
   * Updates multiple entries in the store.
   *
   * @param storeName - The name of the store.
   * @param items - Array of items to update.
   * @returns Observable with the last updated key.
   */
  bulkPut<T>(storeName: string, items: T[]): Observable<IDBValidKey> {
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<IDBValidKey>(observer => {
          let lastKey: IDBValidKey;
          let completed = 0;

          items.forEach(item => {
            const request = store.put(item);

            request.onsuccess = () => {
              lastKey = request.result;
              completed++;
              if (completed === items.length) {
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<void>(observer => {
          const request = store.delete(query);

          request.onsuccess = () => {
            observer.next();
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
   * Deletes multiple entries by their keys.
   *
   * @param storeName - The name of the store.
   * @param keys - Array of keys to delete.
   * @returns Observable with array of remaining entry keys.
   */
  bulkDelete(storeName: string, keys: IDBValidKey[]): Observable<number[]> {
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<number[]>(observer => {
          let completed = 0;

          keys.forEach(key => {
            const request = store.delete(key);

            request.onsuccess = () => {
              completed++;
              if (completed === keys.length) {
                // Return count of remaining items
                const countRequest = store.count();
                countRequest.onsuccess = () => {
                  observer.next([countRequest.result]);
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
      switchMap(store => {
        return new Observable<void>(observer => {
          const request = store.clear();

          request.onsuccess = () => {
            observer.next();
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
      switchMap(store => {
        return new Observable<number>(observer => {
          const request = query ? store.count(query) : store.count();

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
   * Gets the current database version.
   *
   * @returns Observable with the version number.
   */
  getDatabaseVersion(): Observable<number | string> {
    return this.ensureDatabase().pipe(map(db => db.version));
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

    return new Observable<void>(observer => {
      const request = window.indexedDB.deleteDatabase(this.dbConfig!.name);

      request.onsuccess = () => {
        observer.next();
        observer.complete();
      };

      request.onerror = () => {
        observer.error(request.error);
      };
    });
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
   *   mode: DBMode.readonly
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
    return this.getTransaction(options.storeName, options.mode || DBMode.readonly).pipe(
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
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
    return this.getTransaction(storeName, DBMode.readwrite).pipe(
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
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
    return this.getTransaction(storeName, DBMode.readonly).pipe(
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

    // Add to config and increment version
    this.dbConfig.objectStoresMeta.push(storeSchema);
    this.dbConfig.version = (this.dbConfig.version || 1) + 1;
    if (migrationFactory) {
      this.dbConfig.migrationFactory = migrationFactory;
    }

    // Close and reopen database with new version
    if (this.database) {
      this.database.close();
      this.database = null;
    }

    return this.openDatabase().toPromise();
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

    const db = await this.ensureDatabase().toPromise();
    if (!db!.objectStoreNames.contains(storeSchema.store)) {
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
    return this.ensureDatabase().pipe(map(db => Array.from(db.objectStoreNames)));
  }
}
