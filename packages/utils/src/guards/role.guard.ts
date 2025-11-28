import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for role-based guard.
 *
 * @publicApi
 */
export interface RoleGuardConfig {
  /** Required role(s) to access the route */
  requiredRoles: string | string[];
  /** Function to get current user roles */
  getUserRoles: () => string[] | Promise<string[]>;
  /** Redirect URL when role check fails (default: '/unauthorized') */
  redirectUrl?: string;
  /** Match mode: 'any' (at least one role) or 'all' (all roles required) */
  matchMode?: 'any' | 'all';
}

/**
 * Creates a functional route guard that checks user roles.
 *
 * This guard ensures users have the required role(s) before accessing a route,
 * useful for implementing role-based access control (RBAC).
 *
 * @param config - Configuration for the role guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createRoleGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'admin',
 *     component: AdminComponent,
 *     canActivate: [createRoleGuard({
 *       requiredRoles: 'admin',
 *       getUserRoles: () => authService.getUserRoles()
 *     })]
 *   },
 *   {
 *     path: 'management',
 *     component: ManagementComponent,
 *     canActivate: [createRoleGuard({
 *       requiredRoles: ['admin', 'manager'],
 *       getUserRoles: async () => {
 *         const user = await authService.getUser();
 *         return user.roles;
 *       },
 *       matchMode: 'any' // User needs admin OR manager role
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createRoleGuard(config: RoleGuardConfig): CanActivateFn {
  const { requiredRoles, getUserRoles, redirectUrl = '/unauthorized', matchMode = 'any' } = config;

  return async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);

    try {
      const userRolesResult = getUserRoles();
      const userRoles = userRolesResult instanceof Promise ? await userRolesResult : userRolesResult;

      const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      const hasAccess =
        matchMode === 'all'
          ? required.every(role => userRoles.includes(role))
          : required.some(role => userRoles.includes(role));

      if (hasAccess) {
        return true;
      }

      console.warn(`Access denied. Required roles: ${required.join(', ')}`);
      return router.createUrlTree([redirectUrl]);
    } catch (error) {
      console.error('Role guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}
