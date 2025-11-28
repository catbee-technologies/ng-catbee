import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { CookieOptions } from './cookie.types';

/**
 * Injection token for Catbee Cookie global configuration.
 *
 * @public
 */
export const CATBEE_COOKIE_CONFIG = new InjectionToken<CookieOptions>('CATBEE_COOKIE_CONFIG');

/**
 * Provider function for Catbee Cookie global configuration.
 *
 * @param config - Configuration object for cookie services.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideCatbeeCookie } from '@ng-catbee/cookie';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeCookie({
 *       path: '/',          // Default path for cookies
 *       expires: 7,         // Default expiration in days
 *       secure: true,       // Default to secure cookies
 *       sameSite: 'Lax'     // Default SameSite attribute
 *     })
 *   ]
 * };
 * ```
 *
 * @public
 */
export function provideCatbeeCookie(config?: CookieOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CATBEE_COOKIE_CONFIG,
      useValue: config || {}
    }
  ]);
}
