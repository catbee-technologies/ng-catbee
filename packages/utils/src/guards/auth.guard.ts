import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Configuration for authentication guard.
 *
 * @publicApi
 */
export interface AuthGuardConfig {
  /** Function to check if user is authenticated */
  isAuthenticated: () => boolean | Promise<boolean> | Observable<boolean>;
  /** Redirect URL when not authenticated (default: '/login') */
  redirectUrl?: string;
  /** Additional state to pass to redirect route */
  redirectState?: Record<string, unknown>;
}

/**
 * Creates a functional route guard that checks authentication status.
 *
 * This guard prevents unauthorized access to routes by checking authentication
 * and redirecting to a login page when necessary.
 *
 * @param config - Configuration for the auth guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createAuthGuard } from '@ng-catbee/utils/guards';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [createAuthGuard({
 *       isAuthenticated: () => authService.isLoggedIn(),
 *       redirectUrl: '/login'
 *     })]
 *   },
 *   {
 *     path: 'admin',
 *     canActivate: [createAuthGuard({
 *       isAuthenticated: async () => {
 *         const user = await authService.getCurrentUser();
 *         return user?.role === 'admin';
 *       },
 *       redirectUrl: '/unauthorized'
 *     })],
 *     children: [...]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createAuthGuard(config: AuthGuardConfig): CanActivateFn {
  const { isAuthenticated, redirectUrl = '/login', redirectState } = config;

  return async (route, state): Promise<boolean | UrlTree> => {
    const router = inject(Router);

    try {
      const result = isAuthenticated();
      const authenticated = result instanceof Promise ? await result : result;

      if (authenticated) {
        return true;
      }

      // Store attempted URL for redirect after login
      const extras = redirectState ? { state: redirectState } : { queryParams: { returnUrl: state.url } };

      return router.createUrlTree([redirectUrl], extras);
    } catch (error) {
      console.error('Auth guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}

/**
 * Creates a functional route guard for child routes that checks authentication.
 *
 * @param config - Configuration for the auth guard
 * @returns CanActivateChildFn guard function
 *
 * @example
 * ```typescript
 * export const routes: Routes = [
 *   {
 *     path: 'admin',
 *     canActivateChild: [createAuthChildGuard({
 *       isAuthenticated: () => authService.isAdmin()
 *     })],
 *     children: [
 *       { path: 'users', component: UsersComponent },
 *       { path: 'settings', component: SettingsComponent }
 *     ]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createAuthChildGuard(config: AuthGuardConfig): CanActivateChildFn {
  return createAuthGuard(config) as CanActivateChildFn;
}
