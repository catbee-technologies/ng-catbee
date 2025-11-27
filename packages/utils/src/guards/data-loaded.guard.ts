import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for data loaded guard.
 *
 * @publicApi
 */
export interface DataLoadedGuardConfig {
  /** Function to check if required data is loaded */
  isDataLoaded: () => boolean | Promise<boolean>;
  /** Optional function to load data if not already loaded */
  loadData?: () => void | Promise<void>;
  /** Redirect URL when data cannot be loaded (default: '/error') */
  redirectUrl?: string;
  /** Whether to attempt loading data automatically (default: true) */
  autoLoad?: boolean;
}

/**
 * Creates a functional route guard that ensures required data is loaded.
 *
 * This guard checks if required application data is loaded before activating a route,
 * optionally loading it automatically if needed.
 *
 * @param config - Configuration for the data loaded guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createDataLoadedGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [createDataLoadedGuard({
 *       isDataLoaded: () => userService.isUserLoaded(),
 *       loadData: () => userService.loadUser(),
 *       autoLoad: true
 *     })]
 *   },
 *   {
 *     path: 'profile',
 *     component: ProfileComponent,
 *     canActivate: [createDataLoadedGuard({
 *       isDataLoaded: async () => {
 *         const settings = await settingsService.getSettings();
 *         return settings !== null;
 *       },
 *       redirectUrl: '/setup'
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createDataLoadedGuard(config: DataLoadedGuardConfig): CanActivateFn {
  const { isDataLoaded, loadData, redirectUrl = '/error', autoLoad = true } = config;

  return async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);

    try {
      // Check if data is already loaded
      const loadedResult = isDataLoaded();
      const loaded = loadedResult instanceof Promise ? await loadedResult : loadedResult;

      if (loaded) {
        return true;
      }

      // Try to load data if autoLoad is enabled and loadData function is provided
      if (autoLoad && loadData) {
        const loadResult = loadData();
        if (loadResult instanceof Promise) {
          await loadResult;
        }

        // Check again after loading
        const reloadedResult = isDataLoaded();
        const reloaded = reloadedResult instanceof Promise ? await reloadedResult : reloadedResult;

        if (reloaded) {
          return true;
        }
      }

      console.warn('Required data not loaded');
      return router.createUrlTree([redirectUrl]);
    } catch (error) {
      console.error('Data loaded guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}
