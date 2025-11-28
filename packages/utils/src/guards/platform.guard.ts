import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { PlatformService } from '@ng-catbee/utils/platform';

/**
 * Configuration for platform-based guard.
 *
 * @publicApi
 */
export interface PlatformGuardConfig {
  /** Allowed platforms for the route */
  allowedPlatforms?: ('browser' | 'server')[];
  /** Allowed operating systems */
  allowedOS?: ('windows' | 'macos' | 'linux' | 'ios' | 'android')[];
  /** Allowed device types */
  allowedDevices?: ('desktop' | 'mobile' | 'tablet')[];
  /** Redirect URL when platform check fails (default: '/unsupported') */
  redirectUrl?: string;
}

/**
 * Creates a functional route guard based on platform/OS/device.
 *
 * This guard restricts route access based on platform, operating system,
 * or device type, useful for platform-specific features.
 *
 * @param config - Configuration for the platform guard
 * @returns CanActivateFn guard function
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * import { createPlatformGuard } from '@ng-catbee/utils';
 *
 * export const routes: Routes = [
 *   {
 *     path: 'mobile-app',
 *     component: MobileAppComponent,
 *     canActivate: [createPlatformGuard({
 *       allowedDevices: ['mobile', 'tablet']
 *     })]
 *   },
 *   {
 *     path: 'desktop-features',
 *     component: DesktopFeaturesComponent,
 *     canActivate: [createPlatformGuard({
 *       allowedDevices: ['desktop'],
 *       allowedOS: ['windows', 'macos', 'linux']
 *     })]
 *   },
 *   {
 *     path: 'browser-only',
 *     component: BrowserOnlyComponent,
 *     canActivate: [createPlatformGuard({
 *       allowedPlatforms: ['browser']
 *     })]
 *   }
 * ];
 * ```
 *
 * @publicApi
 */
export function createPlatformGuard(config: PlatformGuardConfig): CanActivateFn {
  const { allowedPlatforms, allowedOS, allowedDevices, redirectUrl = '/unsupported' } = config;

  return (): boolean | UrlTree => {
    const router = inject(Router);
    const platformService = inject(PlatformService);

    // Check platform
    if (allowedPlatforms && allowedPlatforms.length > 0) {
      const currentPlatform = platformService.isBrowser ? 'browser' : 'server';
      if (!allowedPlatforms.includes(currentPlatform)) {
        console.warn(`Platform '${currentPlatform}' not allowed`);
        return router.createUrlTree([redirectUrl]);
      }
    }

    // Only check OS and device in browser
    if (platformService.isBrowser) {
      // Check OS
      if (allowedOS && allowedOS.length > 0) {
        const currentOS = platformService.platformOs.toLowerCase();

        const osMatches = allowedOS.some(os => {
          const normalizedOS = os.toLowerCase();
          if (normalizedOS === 'ios') {
            return currentOS === 'ios (apple)';
          }
          return currentOS === normalizedOS;
        });

        if (!osMatches) {
          console.warn(`OS '${currentOS}' not allowed. Allowed: ${allowedOS.join(', ')}`);
          return router.createUrlTree([redirectUrl]);
        }
      }

      // Check device type
      if (allowedDevices && allowedDevices.length > 0) {
        const isMobile = platformService.isMobile;
        const isTablet = platformService.isTablet;
        const isDesktop = !isMobile && !isTablet;

        const deviceMap: Record<string, boolean> = {
          mobile: isMobile,
          tablet: isTablet,
          desktop: isDesktop
        };

        const hasAllowedDevice = allowedDevices.some(device => deviceMap[device]);
        if (!hasAllowedDevice) {
          console.warn(`Device type not allowed. Allowed: ${allowedDevices.join(', ')}`);
          return router.createUrlTree([redirectUrl]);
        }
      }
    }

    return true;
  };
}
