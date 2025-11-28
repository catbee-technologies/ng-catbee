import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';
import { CatbeeLoaderGlobalConfig } from './loader.types';

/**
 * Injection token for global loader configuration
 */
export const CATBEE_LOADER_GLOBAL_CONFIG = new InjectionToken<CatbeeLoaderGlobalConfig>('CATBEE_LOADER_GLOBAL_CONFIG');

/**
 * Provides global loader configuration
 *
 * @param config - Global configuration options
 * @returns Environment providers for the configuration
 *
 * @example
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCatbeeLoader({
 *       defaultAnimation: 'circle-spin-fade',
 *       defaultSize: 'lg',
 *       defaultOverlayColor: 'rgba(0, 0, 0, 0.8)'
 *     })
 *   ]
 * });
 * ```
 */
export function provideCatbeeLoader(config: CatbeeLoaderGlobalConfig): EnvironmentProviders {
  const providers: Provider[] = [
    {
      provide: CATBEE_LOADER_GLOBAL_CONFIG,
      useValue: config
    }
  ];
  return makeEnvironmentProviders(providers);
}
