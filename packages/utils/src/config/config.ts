import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { LoggerConfig } from '@ng-catbee/utils/types';

/**
 * Global configuration for Catbee Utils library.
 *
 * @public
 */
export interface CatbeeUtilsConfig {
  /** Logger service configuration */
  logger?: Partial<LoggerConfig>;
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
