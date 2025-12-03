import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { CookieOptions } from './cookie.types';
import { APP_BASE_HREF, isPlatformBrowser } from '@angular/common';
import { CatbeeCookieReaderService } from './cookie-reader.service';
import { CATBEE_COOKIE_CONFIG } from './cookie.config';

/**
 * Service for managing browser cookies
 *
 * This service provides a safe, type-safe wrapper around browser cookie operations.
 * All methods gracefully handle server-side rendering without throwing errors.
 *
 * @example
 * ```typescript
 * constructor(private cookieService: CatbeeCookieService) {
 *   // Set a cookie
 *   this.cookieService.set('theme', 'dark', { expires: 30, secure: true });
 *
 *   // Get a cookie
 *   const theme = this.cookieService.get('theme');
 *
 *   // Delete a cookie
 *   this.cookieService.delete('theme');
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class CatbeeCookieService extends CatbeeCookieReaderService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appBaseHref = inject<string | null>(APP_BASE_HREF, { optional: true });
  private readonly globalConfig = inject<CookieOptions>(CATBEE_COOKIE_CONFIG, { optional: true });

  protected get isAvailable(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Gets the raw cookie string from document.cookie.
   */
  protected getCookieString(): string | null {
    return this.document.cookie || null;
  }

  private buildCookieString(name: string, value: string, options: CookieOptions): string {
    const { path, domain, secure, sameSite, expires, partitioned, priority } = this.resolveOptions(options);

    let expiresAttr = '';
    if (expires) {
      if (typeof expires === 'number') {
        expiresAttr = `; Expires=${new Date(Date.now() + expires * 24 * 60 * 60 * 1000).toUTCString()}`;
      } else if (expires instanceof Date) {
        expiresAttr = `; Expires=${expires.toUTCString()}`;
      }
    }

    /**
     * SameSite=None requires Secure
     * @link https://developers.google.com/search/blog/2020/01/get-ready-for-new-samesitenone-secure#:~:text=To%20test%20the%20effect%20of,are%20missing%20the%20required%20settings:
     */
    const isSecure = sameSite === 'None' && !secure ? true : secure;
    if (sameSite === 'None' && !secure) {
      console.warn(`Cookie "${name}" with SameSite=None requires Secure. Secure enabled automatically.`);
    }

    let cookie = `${name}=${encodeURIComponent(value)}${expiresAttr}; Path=${path}; SameSite=${sameSite}`;
    if (isSecure) cookie += `; Secure`;
    if (partitioned) cookie += `; Partitioned`;
    if (domain) cookie += `; Domain=${domain}`;
    if (priority) cookie += `; Priority=${priority}`;

    return cookie;
  }

  private resolveOptions(options: CookieOptions): CookieOptions {
    return {
      path: options.path ?? this.globalConfig?.path ?? this.appBaseHref ?? '/',
      domain: options.domain ?? this.globalConfig?.domain,
      secure: options.secure ?? this.globalConfig?.secure ?? false,
      sameSite: options.sameSite ?? this.globalConfig?.sameSite ?? 'Lax',
      expires: options.expires ?? this.globalConfig?.expires,
      partitioned: options.partitioned ?? this.globalConfig?.partitioned,
      priority: options.priority ?? this.globalConfig?.priority ?? 'Medium'
    };
  }

  /**
   * Sets a cookie with the specified name and value.
   *
   * Safe to call during SSR (no-op).
   *
   * @param name - The cookie name.
   * @param value - The cookie value (will be URL-encoded).
   * @param options - Optional cookie configuration.
   *
   * @example
   * ```typescript
   * this.cookieService.set('user', 'john_doe', {
   *   expires: 30, // days
   *   secure: true,
   *   sameSite: 'Strict'
   * });
   * // Or with Date
   * this.cookieService.set('user', 'john_doe', {
   *   expires: new Date('2025-12-31'),
   *   secure: true
   * });
   * ```
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    if (!this.isAvailable) return;

    try {
      this.document.cookie = this.buildCookieString(name, value, this.resolveOptions(options));
    } catch (error) {
      console.error(`Failed to set cookie "${name}":`, error);
    }
  }

  /**
   * Sets a cookie only if it doesn't already exist.
   *
   * Safe to call during SSR (no-op).
   *
   * @param name - The cookie name.
   * @param value - The cookie value (will be URL-encoded).
   * @param options - Optional cookie configuration.
   *
   * @example
   * ```typescript
   * this.cookieService.setIfNotExists('sessionId', generateId());
   * ```
   */
  setIfNotExists(name: string, value: string, options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    const existingCookie = this.get(name);
    if (!existingCookie) {
      this.set(name, value, options);
    }
  }

  /**
   * Stores a JSON-serializable value in a cookie.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of the value to store.
   * @param name - The cookie name.
   * @param value - The value to serialize and store.
   * @param options - Optional cookie configuration.
   *
   * @example
   * ```typescript
   * this.cookieService.setJson('preferences', {
   *   theme: 'dark',
   *   notifications: true
   * }, { expires: 30 });
   * ```
   */
  setJson<T>(name: string, value: T, options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    try {
      this.set(name, JSON.stringify(value), options);
    } catch (error) {
      console.error(`Failed to stringify JSON for cookie "${name}":`, error);
    }
  }

  /**
   * Retrieves a JSON value from a cookie with auto-set default.
   *
   * If the cookie doesn't exist or contains invalid JSON, sets it to the default.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of the value to retrieve.
   * @param name - The cookie name.
   * @param defaultValue - The default value to set and return if cookie not found or invalid.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed JSON value or the default.
   *
   * @example
   * ```typescript
   * // Gets JSON or sets default if missing/invalid
   * const prefs = this.cookieService.getJsonWithDefault('preferences', { theme: 'light' }, { expires: 30 });
   * ```
   */
  getJsonWithDefault<T>(name: string, defaultValue: T, options: CookieOptions = {}): T {
    if (!this.isAvailable) return defaultValue;
    const value = this.getJson<T>(name);
    if (value !== null) {
      return value;
    }
    this.setJson(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Stores an array in a cookie.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of array elements.
   * @param name - The cookie name.
   * @param value - The array to store.
   * @param options - Optional cookie configuration.
   */
  setArray<T>(name: string, value: T[], options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    this.setJson(name, value, options);
  }

  /**
   * Retrieves an array from a cookie with type safety and auto-set default.
   *
   * If the cookie doesn't exist or contains invalid data, sets it to the default.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of array elements.
   * @param name - The cookie name.
   * @param defaultValue - The default array to set and return if cookie not found or invalid.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed array or the default.
   *
   * @example
   * ```typescript
   * // Gets array or sets default if missing/invalid
   * const tags = this.cookieService.getArrayWithDefault('tags', ['default'], { expires: 7 });
   * ```
   */
  getArrayWithDefault<T>(name: string, defaultValue: T[], options: CookieOptions = {}): T[] {
    if (!this.isAvailable) return defaultValue;
    const value = this.getArray<T>(name);
    if (value !== null) {
      return value;
    }
    this.setArray(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Updates a stored JSON cookie with partial values.
   *
   * Merges the new values with existing ones (shallow merge).
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of the stored object.
   * @param name - The cookie name.
   * @param updates - Partial object with values to update.
   * @param defaultValue - Default value if cookie doesn't exist.
   * @param options - Optional cookie configuration.
   */
  updateJson<T extends Record<string, unknown>>(
    name: string,
    updates: Partial<T>,
    defaultValue: T | null,
    options: CookieOptions = {}
  ): void {
    if (!this.isAvailable) return;
    const current = this.getJson<T>(name);
    this.setJson(name, { ...(defaultValue ?? {}), ...(current ?? {}), ...updates }, options);
  }

  /**
   * Retrieves a string value from a cookie with validation and auto-set default.
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value if cookie not found or value is invalid.
   * @param allowedValues - Array of allowed values. If empty, any value is accepted.
   * @param options - Optional cookie configuration for setting default.
   * @returns The cookie value if valid, otherwise the default value.
   */
  getWithDefault(
    name: string,
    defaultValue: string,
    allowedValues: string[] = [],
    options: CookieOptions = {}
  ): string {
    if (!this.isAvailable) return defaultValue;
    const value = this.get(name);
    if (value) {
      if (allowedValues.length && !allowedValues.includes(value)) {
        this.set(name, defaultValue, options);
        return defaultValue;
      }
      return value;
    }
    this.set(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Retrieves an boolean value from a cookie with type safety and auto-set default.
   *
   * Recognizes common boolean string representations:
   * - Truthy: 'true', '1', 'yes', 'on'
   * - Falsy: 'false', '0', 'no', 'off'
   *
   * If the cookie doesn't exist or has an invalid value, sets it to the default.
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value to set and return if cookie not found or value is invalid.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed boolean value or the default.
   *
   * @example
   * ```typescript
   * // Gets boolean or sets default if missing/invalid
   * const enabled = this.cookieService.getBooleanWithDefault('feature', true, { expires: 30 });
   * ```
   */
  getBooleanWithDefault(name: string, defaultValue: boolean, options: CookieOptions = {}): boolean {
    if (!this.isAvailable) return defaultValue;
    const value = this.get(name)?.toLowerCase() || '';
    if (['true', '1', 'yes', 'on'].includes(value)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(value)) {
      return false;
    }
    this.set(name, defaultValue.toString(), options);
    return defaultValue;
  }

  /**
   * Retrieves a numeric value from a cookie with auto-set default.with auto-set default.
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value to set and return if cookie not found or value is not a valid number.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed number or the default.
   *
   * @example
   * ```typescript
   * // Gets number or sets default if missing/invalid
   * const count = this.cookieService.getNumberWithDefault('counter', 0, { expires: 7 });
   * ```
   */
  getNumberWithDefault(name: string, defaultValue: number, options: CookieOptions = {}): number {
    if (!this.isAvailable) return defaultValue;
    const value = this.get(name);
    const parsed = Number.parseFloat(value || '');
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      this.set(name, defaultValue.toString(), options);
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Retrieves an enum value from a cookie with type safety and auto-set default.
   *
   * @template T - The enum type (must extend string).
   * @param name - The cookie name.
   * @param defaultValue - The default enum value to set and return if cookie not found or value is invalid.
   * @param enumValues - Array of valid enum values for validation.
   * @param options - Optional cookie configuration for setting default.
   * @returns The cookie enum value if valid, otherwise the default.
   *
   * @example
   * ```typescript
   * type Theme = 'light' | 'dark' | 'auto';
   * const themes: readonly Theme[] = ['light', 'dark', 'auto'];
   * // Gets enum or sets default if missing/invalid
   * const theme = this.cookieService.getEnumWithDefault('theme', 'light', themes, { expires: 365 });
   * ```
   */
  getEnumWithDefault<T extends string>(
    name: string,
    defaultValue: T,
    enumValues: readonly T[],
    options: CookieOptions = {}
  ): T {
    if (!this.isAvailable) return defaultValue;
    const value = this.get(name);

    if (typeof value === 'string' && enumValues.includes(value as T)) {
      return value as T;
    }

    this.set(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Deletes multiple cookies at once.
   *
   * Safe to call during SSR (no-op).
   *
   * @param names - Array of cookie names to delete.
   * @param options - Optional cookie configuration (path, domain, etc.).
   */
  deleteMany(names: string[], options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    for (const name of names) {
      this.delete(name, options);
    }
  }

  /**
   * Deletes all cookies.
   *
   * Note: This only deletes cookies accessible from the current path.
   * Cookies with different paths may require explicit deletion.
   * Safe to call during SSR (no-op).
   *
   * @param options - Optional cookie configuration (path, domain, etc.).
   */
  deleteAll(options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    try {
      const cookieNames = this.keys();
      for (const name of cookieNames) {
        this.delete(name, options);
      }
    } catch (error) {
      console.error('Failed to clear cookies:', error);
    }
  }

  /**
   * Deletes a cookie by setting its expiration to the past.
   *
   * Safe to call during SSR (no-op).
   *
   * @param name - The cookie name.
   * @param options - Optional cookie configuration (path, domain, etc.).
   *
   * @example
   * ```typescript
   * this.cookieService.delete('sessionId', {});
   * // Or with specific path
   * this.cookieService.delete('sessionId', { path: '/app' });
   * ```
   */
  delete(name: string, options: CookieOptions = {}): void {
    if (!this.isAvailable) return;
    try {
      this.document.cookie = this.buildCookieString(name, '', {
        ...this.resolveOptions(options),
        expires: new Date(0)
      });
    } catch (error) {
      console.error(`Failed to delete cookie "${name}":`, error);
    }
  }
}

/**
 * Public alias for the `CatbeeCookieService` used throughout the Catbee Cookie module.
 *
 * This export re-exports the underlying service to provide a consistent and
 * simplified public API name across Catbee packages. No functionality is modified.
 *
 * @alias CookieService
 * @see CatbeeCookieService
 *
 * @example
 * ```ts
 * import { CookieService } from '@ng-catbee/cookie';
 *
 * constructor(private cookies: CookieService) {
 *   this.cookies.set('theme', 'dark', { expires: 30 });
 *   const theme = this.cookies.get('theme');
 * }
 * ```
 *
 * @public
 */
export const CookieService = CatbeeCookieService;
