import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for permission-based guard.
 *
 * @publicApi
 */
export interface PermissionGuardConfig {
  /** Required permission(s) to access the route */
  requiredPermissions: string | string[];
  /** Function to check if user has permission */
  hasPermission: (permission: string) => boolean | Promise<boolean>;
  /** Redirect URL when permission check fails (default: '/forbidden') */
  redirectUrl?: string;
  /** Match mode: 'any' (at least one permission) or 'all' (all permissions required) */
  matchMode?: 'any' | 'all';
}

/**
 * Creates a functional route guard that checks user permissions.
 *
 * This guard implements fine-grained permission-based access control,
 * checking specific permissions before allowing route access.
 *
 * @param config - Configuration for the permission guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createPermissionGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'users/create',
 *     component: CreateUserComponent,
 *     canActivate: [createPermissionGuard({
 *       requiredPermissions: 'users.create',
 *       hasPermission: (perm) => authService.hasPermission(perm)
 *     })]
 *   },
 *   {
 *     path: 'reports',
 *     component: ReportsComponent,
 *     canActivate: [createPermissionGuard({
 *       requiredPermissions: ['reports.view', 'reports.export'],
 *       hasPermission: async (perm) => {
 *         const permissions = await authService.getPermissions();
 *         return permissions.includes(perm);
 *       },
 *       matchMode: 'all' // Requires both permissions
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createPermissionGuard(config: PermissionGuardConfig): CanActivateFn {
  const { requiredPermissions, hasPermission, redirectUrl = '/forbidden', matchMode = 'any' } = config;

  return async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);

    try {
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      const checks = await Promise.all(
        permissions.map(async permission => {
          const result = hasPermission(permission);
          return result instanceof Promise ? await result : result;
        })
      );

      const hasAccess = matchMode === 'all' ? checks.every(Boolean) : checks.some(Boolean);

      if (hasAccess) {
        return true;
      }

      console.warn(`Access denied. Required permissions: ${permissions.join(', ')}`);
      return router.createUrlTree([redirectUrl]);
    } catch (error) {
      console.error('Permission guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}
