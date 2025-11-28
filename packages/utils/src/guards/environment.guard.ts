import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for environment-based guard.
 *
 * @publicApi
 */
export interface EnvironmentGuardConfig {
  /** Allowed environments for the route */
  allowedEnvironments: string[];
  /** Function to get current environment */
  getCurrentEnvironment: () => string;
  /** Redirect URL when environment check fails (default: '/') */
  redirectUrl?: string;
  /** Whether to show warning in console (default: true) */
  showWarning?: boolean;
}

/**
 * Creates a functional route guard based on environment.
 *
 * This guard restricts route access based on the current environment,
 * useful for development-only features or staging previews.
 *
 * @param config - Configuration for the environment guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createEnvironmentGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'debug',
 *     component: DebugComponent,
 *     canActivate: [createEnvironmentGuard({
 *       allowedEnvironments: ['development', 'staging'],
 *       getCurrentEnvironment: () => environment.name
 *     })]
 *   },
 *   {
 *     path: 'playground',
 *     component: PlaygroundComponent,
 *     canActivate: [createEnvironmentGuard({
 *       allowedEnvironments: ['development'],
 *       getCurrentEnvironment: () => environment.name,
 *       redirectUrl: '/not-found'
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createEnvironmentGuard(config: EnvironmentGuardConfig): CanActivateFn {
  const { allowedEnvironments, getCurrentEnvironment, redirectUrl = '/', showWarning = true } = config;

  return (): boolean | UrlTree => {
    const router = inject(Router);

    try {
      const currentEnv = getCurrentEnvironment();

      if (allowedEnvironments.includes(currentEnv)) {
        return true;
      }

      if (showWarning) {
        console.warn(
          `Access denied. Route only available in: ${allowedEnvironments.join(', ')}. Current: ${currentEnv}`
        );
      }

      return router.createUrlTree([redirectUrl]);
    } catch (error) {
      console.error('Environment guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}
