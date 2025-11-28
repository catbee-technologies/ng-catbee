/**
 * Configuration for initializing and managing an IndexedDB database instance
 * under the Catbee IndexedDB service.
 *
 * @remarks
 * Each database must define one or more object stores, optionally including
 * schema for index definitions. Versioning allows structured migrations over time.
 *
 * @public
 */
export interface CatbeeIndexedDBConfig {
  /** Name of the IndexedDB database */
  name: string;

  /**
   * Optional database version number.
   * If omitted — database opens with its existing version or default `1`.
   */
  version?: number;

  /**
   * List of object stores and their schema to be created.
   * Used during initial creation & version upgrades.
   */
  objectStoresMeta: ObjectStoreMeta[];

  /**
   * Optional migration handler that executes on version upgrades.
   *
   * @example
   * ```ts
   * migrationFactory: () => ({
   *   2: (db, tx) => db.createObjectStore("logs", { keyPath: "id" })
   * })
   * ```
   */
  migrationFactory?: () => Record<number, (db: IDBDatabase, transaction: IDBTransaction) => void>;

  /**
   * Marks this configuration as the application's default DB.
   * Useful when using multiple IndexedDB databases.
   */
  isDefault?: boolean;

  /**
   * Optional cache configuration for database operations.
   * When enabled, frequently accessed data is cached in memory.
   *
   * @example
   * ```ts
   * cache: {
   *   enabled: true,
   *   expirySeconds: 300 // 5 minutes
   * }
   * ```
   */
  cache?: {
    /** Whether caching is enabled (default: false) */
    enabled?: boolean;
    /** Cache expiry time in seconds (default: 300 = 5 minutes) */
    expirySeconds?: number;
  };
}

/**
 * Metadata describing an IndexedDB object store.
 *
 * @public
 */
export interface ObjectStoreMeta {
  /** Name of the object store */
  store: string;

  /**
   * Store configuration such as key path and autoincrement mode.
   * Additional internal IndexedDB options may be provided.
   */
  storeConfig: {
    keyPath: string | string[];
    autoIncrement: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // extended options allowed
  };

  /**
   * Optional array of index configurations to create within the store.
   */
  storeSchema: ObjectStoreSchema[];
}

/**
 * Describes an index inside an object store.
 * Indexes improve filter/query performance.
 *
 * @public
 */
export interface ObjectStoreSchema {
  /** Unique name assigned to the index */
  name: string;

  /** Field(s) the index references */
  keypath: string | string[];

  /**
   * Index configuration options.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/createIndex
   */
  options: {
    /** Whether indexed values must be unique */
    unique: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // additional native options
  };
}

/**
 * Details used for selecting an index during cursor operations.
 *
 * @public
 */
export interface IndexDetails {
  /** Name of the index to read from */
  indexName: string;

  /** Sorting direction: "next" (asc) or "prev" (desc) */
  order: string;
}

/**
 * Typed event emitted from IndexedDB requests.
 *
 * @template T Expected request result type
 * @public
 */
export interface RequestEvent<T> extends Event {
  target: RequestEventTarget<T>;
}

/**
 * EventTarget wrapper carrying a typed `result` payload.
 *
 * @template T Expected request result type
 * @public
 */
export interface RequestEventTarget<T> extends EventTarget {
  /** Result returned by IndexedDB request (single record or array) */
  result: T | T[];
}

/**
 * IndexedDB transaction modes supported by Catbee service.
 *
 * @public
 */
export enum DBMode {
  /** Read operations only */
  ReadOnly = 'readonly',
  /** Read and write access */
  ReadWrite = 'readwrite'
}

/**
 * Helper shape for any object that contains a numeric `id`.
 *
 * @remarks
 * Commonly used for standard auto-increment primary key models.
 *
 * @public
 */
export interface WithID {
  id: number;
}

/**
 * Represents an IndexedDB cursor key-pair type.
 *
 * @template P Primary key type
 * @template K Index key type
 * @public
 */
export interface IndexKey<P extends IDBValidKey, K extends IDBValidKey> {
  readonly primaryKey: P;
  readonly key: K;
}

/**
 * Utility type for extending and modifying existing types.
 *
 * @template T Base type
 * @template R Fields to replace in T
 */
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Typed IndexedDB cursor supporting strongly typed primary/index keys.
 *
 * @template P Primary key type
 * @template K Secondary index key type
 * @template V Stored value (default unknown)
 * @public
 */
export type CatbeeIDBCursor<P extends IDBValidKey, K extends IDBValidKey, V = unknown> = Modify<
  IDBCursor,
  {
    /** Index key at cursor position */
    key: K;
    /** Primary key at cursor position */
    primaryKey: P;
    /** Updates value at cursor position */
    update(value: V): IDBRequest<IDBValidKey>;
  }
>;

/**
 * Cursor type containing real typed `value` records.
 *
 * @template V Item type stored in DB
 * @template P Primary key type
 * @template K Index key type
 * @public
 */
export type CatbeeIDBCursorWithValue<
  V = unknown,
  P extends IDBValidKey = IDBValidKey,
  K extends IDBValidKey = IDBValidKey
> = CatbeeIDBCursor<P, K, V> & {
  value: V;
};

/**
 * Event describing CRUD actions within the database.
 *
 * @public
 */
export interface DatabaseEvent {
  /** Action type executed */
  type: 'add' | 'update' | 'delete' | 'clear' | 'batch' | 'import' | 'bulkAdd' | 'bulkUpdate' | 'bulkDelete';
  /** Object store impacted */
  storeName: string;
  /** Additional payload for event consumers */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

/**
 * Represents a queueable batch database operation.
 *
 * @template T Record type being operated on
 * @public
 */
export type BatchOperation<T> =
  | { type: 'add'; value: T; key?: unknown }
  | { type: 'update'; value: T }
  | { type: 'delete'; key: IDBValidKey };

/**
 * Operators supported inside query executions.
 *
 * @public
 */
export type QueryOperator = '=' | '>' | '<' | '>=' | '<=' | '!=';

/**
 * State of the IndexedDB connection lifecycle.
 *
 * @public
 */
export type DatabaseState = 'closed' | 'opening' | 'open' | 'error';
