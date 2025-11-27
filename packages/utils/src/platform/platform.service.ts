import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Service for platform detection and OS identification.
 *
 * This service provides utilities to determine the execution context (browser vs server)
 * and detect the user's operating system. All operations are safe in SSR environments.
 *
 * @example
 * ```typescript
 * constructor(private platformService: PlatformService) {
 *   if (this.platformService.isBrowser) {
 *     // Browser-specific code
 *     console.log('Running on:', this.platformService.platformOs);
 *   }
 *
 *   if (this.platformService.isServer) {
 *     // Server-specific code
 *   }
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Checks if the application is running in a browser environment.
   *
   * @returns `true` if running in browser, `false` if in server context.
   *
   * @example
   * ```typescript
   * if (this.platformService.isBrowser) {
   *   window.localStorage.setItem('key', 'value');
   * }
   * ```
   */
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Checks if the application is running in a server environment (SSR).
   *
   * @returns `true` if running on server, `false` if in browser context.
   *
   * @example
   * ```typescript
   * if (this.platformService.isServer) {
   *   // Perform server-side data fetching
   * }
   * ```
   */
  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Detects the user's operating system based on the user agent.
   *
   * Returns 'Windows' by default in SSR context.
   *
   * @returns The detected OS name: 'Android', 'iOS (Apple)', 'Windows', 'Linux', 'macOS', or 'Unknown'.
   *
   * @example
   * ```typescript
   * const os = this.platformService.platformOs;
   * if (os === 'iOS') {
   *   // Show iOS-specific UI
   * }
   * ```
   */
  get platformOs(): 'Android' | 'iOS' | 'Windows' | 'Linux' | 'macOS' | 'Unknown' {
    if (!this.isBrowser) return 'Windows';

    try {
      // Try modern userAgentData API first
      const nav = window.navigator as Navigator & { userAgentData?: { platform?: string } };
      if (nav?.userAgentData?.platform) {
        const platform = nav.userAgentData.platform.toLowerCase();
        if (platform.includes('android')) return 'Android';
        if (platform.includes('mac')) return 'macOS';
        if (platform.includes('win')) return 'Windows';
        if (platform.includes('linux')) return 'Linux';
      }

      // Fallback to userAgent
      const userAgent = window.navigator.userAgent.toLowerCase();

      if (userAgent.includes('android')) {
        return 'Android';
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
        return 'iOS';
      } else if (userAgent.includes('mac')) {
        return 'macOS';
      } else if (userAgent.includes('win')) {
        return 'Windows';
      } else if (userAgent.includes('linux')) {
        return 'Linux';
      } else {
        return 'Unknown';
      }
    } catch (error) {
      console.error('Failed to detect platform OS:', error);
      return 'Unknown';
    }
  }

  /**
   * Checks if the user is on a mobile device.
   *
   * @returns `true` if on a mobile device (Android or iOS), `false` otherwise or in SSR.
   *
   * @example
   * ```typescript
   * if (this.platformService.isMobile) {
   *   // Show mobile-optimized layout
   * }
   * ```
   */
  get isMobile(): boolean {
    if (!this.isBrowser) return false;

    try {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
    } catch (error) {
      console.error('Failed to detect mobile device:', error);
      return false;
    }
  }

  get isAndroid(): boolean {
    if (!this.isBrowser) return false;

    try {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /android/i.test(userAgent);
    } catch (error) {
      console.error('Failed to detect Android device:', error);
      return false;
    }
  }

  get isIOS(): boolean {
    if (!this.isBrowser) return false;

    try {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod');
    } catch (error) {
      console.error('Failed to detect iOS device:', error);
      return false;
    }
  }

  private browser: Record<string, string | boolean> | null = null;
  getBrowser() {
    // Don't cache if we're on server, recalculate each time in browser
    if (!this.isBrowser) {
      return {};
    }

    if (!this.browser) {
      const resolved = this.resolveUserAgent();
      this.browser = {};

      if (resolved.browser) {
        this.browser[resolved.browser] = true;
        this.browser['version'] = resolved.version;
      }

      if (this.browser['chrome']) {
        this.browser['webkit'] = true;
      } else if (this.browser['webkit']) {
        this.browser['safari'] = true;
      }
    }
    return this.browser;
  }

  resolveUserAgent() {
    if (!this.isBrowser) {
      return { browser: '', version: '0' };
    }

    const useragent = navigator.userAgent.toLowerCase();
    const match =
      /(chrome)[ /]([\w.]+)/.exec(useragent) ||
      /(webkit)[ /]([\w.]+)/.exec(useragent) ||
      /(opera)(?:.*version|)[ /]([\w.]+)/.exec(useragent) ||
      /(msie) ([\w.]+)/.exec(useragent) ||
      (useragent.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(useragent)) ||
      [];

    return {
      browser: match[1] || '',
      version: match[2] || '0'
    };
  }

  /**
   * Checks if the user is on a tablet device.
   *
   * @returns `true` if on a tablet (iPad or Android tablet), `false` otherwise or in SSR.
   *
   * @example
   * ```typescript
   * if (this.platformService.isTablet) {
   *   // Show tablet-optimized layout
   * }
   * ```
   */
  public get isTablet(): boolean {
    if (!this.isBrowser) return false;

    try {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /ipad|android(?!.*mobile)/i.test(userAgent);
    } catch (error) {
      console.error('Failed to detect tablet device:', error);
      return false;
    }
  }
}
