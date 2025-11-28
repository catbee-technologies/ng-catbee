import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { CatbeeIndexedDBConfig } from './indexed-db.types';

/**
 * Injection token for Catbee Utils global configuration.
 *
 * @public
 */
export const CATBEE_INDEXED_DB_CONFIG = new InjectionToken<CatbeeIndexedDBConfig>('CATBEE_INDEXED_DB_CONFIG');

/**
 * Provides Catbee IndexedDB configuration.
 *
 * @param config - IndexedDB configuration object.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideCatbeeIndexedDB } from '@catbee/indexed-db';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeIndexedDB({
 *       name: 'MyAppDB',
 *       version: 1,
 *       objectStoresMeta: [
 *         {
 *           store: 'users',
 *           storeConfig: { keyPath: 'id', autoIncrement: true },
 *           storeSchema: [
 *             { name: 'email', keypath: 'email', options: { unique: true } },
 *             { name: 'name', keypath: 'name', options: { unique: false } }
 *           ]
 *         },
 *         {
 *           store: 'snippets',
 *           storeConfig: { keyPath: 'id', autoIncrement: false },
 *           storeSchema: [
 *             { name: 'fileName', keypath: 'fileName', options: { unique: true } },
 *             { name: 'code', keypath: 'code', options: { unique: false } },
 *             { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
 *             { name: 'updatedAt', keypath: 'updatedAt', options: { unique: false } }
 *           ]
 *         }
 *       ]
 *     })
 *   ]
 * };
 * ```
 *
 * @public
 */
export function provideCatbeeIndexedDB(config?: CatbeeIndexedDBConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CATBEE_INDEXED_DB_CONFIG,
      useValue: config || {}
    }
  ]);
}
