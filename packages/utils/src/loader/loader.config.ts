import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';
import { LoaderAnimation, LoaderSize } from './loader.types';

/**
 * Global configuration for loaders
 */
export interface CatbeeLoaderGlobalConfig {
  /** Default animation type for all loaders */
  defaultAnimation?: LoaderAnimation;
  /** Default size for all loaders */
  defaultSize?: LoaderSize;
  /** Default overlay color */
  defaultOverlayColor?: string;
  /** Default loader color */
  defaultLoaderColor?: string;
  /** Default z-index */
  defaultZIndex?: number;
  /** Default block scroll behavior */
  defaultBlockScroll?: boolean;
}

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
