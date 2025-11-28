import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for network guard.
 *
 * @publicApi
 */
export interface NetworkGuardConfig {
  /** Redirect path when offline (default: '/offline') */
  offlinePath?: string;
  /** Whether to show console warning (default: true) */
  showWarning?: boolean;
}

/**
 * Creates a functional route guard that checks network connectivity.
 *
 * This guard prevents access to routes when the device is offline,
 * useful for features that require internet connectivity.
 *
 * @param config - Configuration for the network guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createNetworkGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'cloud-sync',
 *     component: CloudSyncComponent,
 *     canActivate: [createNetworkGuard({
 *       offlineUrl: '/offline-message'
 *     })]
 *   },
 *   {
 *     path: 'api-data',
 *     component: ApiDataComponent,
 *     canActivate: [createNetworkGuard()]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createNetworkGuard(config: NetworkGuardConfig = {}): CanActivateFn {
  const { offlinePath = '/offline', showWarning = true } = config;

  return (): boolean | UrlTree => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // Always allow in SSR
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    const isOnline = navigator.onLine ?? true;
    if (isOnline) {
      return true;
    }

    if (showWarning) {
      console.warn('Network guard: Device is offline');
    }

    return router.createUrlTree([offlinePath]);
  };
}
