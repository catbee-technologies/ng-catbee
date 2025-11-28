import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

/**
 * Configuration for feature flag guard.
 *
 * @publicApi
 */
export interface FeatureFlagGuardConfig {
  /** Feature flag key(s) to check */
  featureFlags: string | string[];
  /** Function to check if feature is enabled */
  isFeatureEnabled: (flag: string) => boolean | Promise<boolean>;
  /** Redirect URL when feature is disabled (default: '/not-found') */
  redirectUrl?: string;
  /** Match mode: 'any' (at least one enabled) or 'all' (all enabled) */
  matchMode?: 'any' | 'all';
}

/**
 * Creates a functional route guard based on feature flags.
 *
 * This guard enables/disables routes based on feature flag configuration,
 * useful for gradual feature rollouts and A/B testing.
 *
 * @param config - Configuration for the feature flag guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createFeatureFlagGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'beta-feature',
 *     component: BetaFeatureComponent,
 *     canActivate: [createFeatureFlagGuard({
 *       featureFlags: 'beta_features_enabled',
 *       isFeatureEnabled: (flag) => featureFlagService.isEnabled(flag),
 *       redirectUrl: '/coming-soon'
 *     })]
 *   },
 *   {
 *     path: 'advanced',
 *     component: AdvancedComponent,
 *     canActivate: [createFeatureFlagGuard({
 *       featureFlags: ['advanced_mode', 'pro_features'],
 *       isFeatureEnabled: async (flag) => {
 *         const config = await featureFlagService.getConfig();
 *         return config[flag] === true;
 *       },
 *       matchMode: 'all'
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createFeatureFlagGuard(config: FeatureFlagGuardConfig): CanActivateFn {
  const { featureFlags, isFeatureEnabled, redirectUrl = '/not-found', matchMode = 'any' } = config;

  return async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);

    try {
      const flags = Array.isArray(featureFlags) ? featureFlags : [featureFlags];

      const checks = await Promise.all(
        flags.map(async flag => {
          const result = isFeatureEnabled(flag);
          return result instanceof Promise ? await result : result;
        })
      );

      const isEnabled = matchMode === 'all' ? checks.every(Boolean) : checks.some(Boolean);

      if (isEnabled) {
        return true;
      }

      console.info(`Feature disabled: ${flags.join(', ')}`);
      return router.createUrlTree([redirectUrl]);
    } catch (error) {
      console.error('Feature flag guard error:', error);
      return router.createUrlTree([redirectUrl]);
    }
  };
}
