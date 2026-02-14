import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * Global configuration for Catbee Utils library.
 *
 * @public
 */
export interface CatbeeUtilsConfig {
  TODO: string; // Placeholder for future global configuration options
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
 * Use this provider to configure all utilities in one place.
 *
 * @param config - Global configuration for the utils library.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideCatbeeUtils } from '@catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeUtils({})
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
