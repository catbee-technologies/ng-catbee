import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { IndexedDBConfig, LoggerConfig } from '@ng-catbee/utils/types';
import type { StorageServiceConfig } from '@ng-catbee/utils/types';

/**
 * Global configuration for Catbee Utils library.
 *
 * @public
 */
export interface CatbeeUtilsConfig {
  /** Logger service configuration */
  logger?: Partial<LoggerConfig>;
  /** IndexedDB service configuration */
  indexedDb?: IndexedDBConfig;
  /** Storage encoding/decoding configuration for localStorage, sessionStorage, and cookies */
  storage?: StorageServiceConfig;
}

/**
 * Injection token for Catbee Utils global configuration.
 *
 * @public
 */
export const CATBEE_UTILS_CONFIG = new InjectionToken<CatbeeUtilsConfig>('CATBEE_UTILS_CONFIG');

/**
 * Provides global configuration for Catbee Utils library.
 *
 * Use this provider to configure all utilities in one place, including logger settings.
 *
 * @param config - Global configuration for the utils library.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideCatbeeUtils, LogLevel } from '@catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeUtils({
 *       logger: {
 *         minLevel: LogLevel.INFO,
 *         prefix: '[MyApp]',
 *         useColors: true,
 *         timestampFormat: 'time',
 *         includeTimestamp: true
 *       },
 *       storage: {
 *         common: { encoding: 'default' }, // Default for all
 *         localStorage: { encoding: 'base64' }, // Override for localStorage
 *         cookies: { encoding: 'none' } // No encoding for cookies
 *       },
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
 *           },
 *           {
 *             store: 'snippets',
 *             storeConfig: { keyPath: 'id', autoIncrement: false },
 *             storeSchema: [
 *               { name: 'fileName', keypath: 'fileName', options: { unique: true } },
 *               { name: 'code', keypath: 'code', options: { unique: false } },
 *               { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
 *               { name: 'updatedAt', keypath: 'updatedAt', options: { unique: false } }
 *             ]
 *           }
 *         ]
 *       }
 *     })
 *   ]
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Environment-based configuration
 * import { provideCatbeeUtils, LogLevel } from '@catbee/utils';
 * import { environment } from './environments/environment';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeUtils({
 *       logger: environment.production ? {
 *         minLevel: LogLevel.WARN,
 *         useColors: false
 *       } : {
 *         minLevel: LogLevel.DEBUG,
 *         useColors: true,
 *         prefix: '[DEV]'
 *       }
 *     })
 *   ]
 * };
 * ```
 *
 * @public
 */
export function provideCatbeeUtils(config?: CatbeeUtilsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CATBEE_UTILS_CONFIG,
      useValue: config || {}
    }
  ]);
}
