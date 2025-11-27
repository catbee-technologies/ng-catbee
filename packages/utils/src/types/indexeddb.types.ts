/**
 * Database configuration interface.
 *
 * @public
 */
export interface IndexedDBConfig {
  /** Database name */
  name: string;
  /** Database version number */
  version?: number;
  /** Object stores metadata */
  objectStoresMeta: ObjectStoreMeta[];
  /** Migration factory for version upgrades */
  migrationFactory?: () => Record<number, (db: IDBDatabase, transaction: IDBTransaction) => void>;
  /** Whether this is the default database */
  isDefault?: boolean;
}

/**
 * Object store metadata configuration.
 *
 * @public
 */
export interface ObjectStoreMeta {
  /** Store name */
  store: string;
  /** Store configuration */
  storeConfig: {
    keyPath: string | string[];
    autoIncrement: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  /** Store schema for indexes */
  storeSchema: ObjectStoreSchema[];
}

/**
 * Object store schema for indexes.
 *
 * @public
 */
export interface ObjectStoreSchema {
  /** Index name */
  name: string;
  /** Index key path */
  keypath: string | string[];
  /** Index options */
  options: {
    unique: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

/**
 * Index details for cursor operations.
 *
 * @public
 */
export interface IndexDetails {
  /** Index name */
  indexName: string;
  /** Sort order */
  order: string;
}

/**
 * Request event with typed result.
 *
 * @public
 */
export interface RequestEvent<T> extends Event {
  target: RequestEventTarget<T>;
}

/**
 * Request event target with typed result.
 *
 * @public
 */
export interface RequestEventTarget<T> extends EventTarget {
  result: T | T[];
}

/**
 * Database transaction modes.
 *
 * @public
 */
export enum DBMode {
  readonly = 'readonly',
  readwrite = 'readwrite'
}

/**
 * Type helper for objects with ID.
 *
 * @public
 */
export interface WithID {
  id: number;
}

/**
 * Index key type for cursor operations.
 *
 * @public
 */
export interface IndexKey<P extends IDBValidKey, K extends IDBValidKey> {
  readonly primaryKey: P;
  readonly key: K;
}

/**
 * Utility type to modify object properties.
 */
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Typed cursor interface.
 *
 * @public
 */
export type CatbeeIDBCursor<P extends IDBValidKey, K extends IDBValidKey, V = unknown> = Modify<
  IDBCursor,
  {
    key: K;
    primaryKey: P;
    update(value: V): IDBRequest<IDBValidKey>;
  }
>;

/**
 * Typed cursor with value interface.
 *
 * @public
 */

export type CatbeeIDBCursorWithValue<
  V = unknown,
  P extends IDBValidKey = IDBValidKey,
  K extends IDBValidKey = IDBValidKey
> = CatbeeIDBCursor<P, K, V> & {
  value: V;
};
