import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { CatbeeStorageConfig } from './storage.types';

/**
 * Injection token for Catbee Storage global configuration.
 *
 * @public
 */
export const CATBEE_STORAGE_CONFIG = new InjectionToken<CatbeeStorageConfig>('CATBEE_STORAGE_CONFIG');

/**
 * Provider function for Catbee Storage global configuration.
 *
 * @param config - Configuration object for storage services.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideCatbeeStorage } from '@ng-catbee/storage';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeStorage({
 *       common: { encoding: 'default' }, // Default for all
 *       localStorage: { encoding: 'base64' },
 *       sessionStorage: {
 *         encoding: 'custom',
 *         customEncoder: (v) => btoa(v),
 *         customDecoder: (v) => atob(v)
 *        }
 *     })
 *   ]
 * };
 * ```
 *
 * @public
 */
export function provideCatbeeStorage(config?: CatbeeStorageConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CATBEE_STORAGE_CONFIG,
      useValue: config || {}
    }
  ]);
}
