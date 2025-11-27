import { DOCUMENT, inject, Injectable } from '@angular/core';
import { StorageEncoderService } from '@ng-catbee/utils/common';
import type { CookieOptions } from '@ng-catbee/utils/types';

/**
 * Service for managing browser cookies
 *
 * This service provides a safe, type-safe wrapper around browser cookie operations.
 * All methods gracefully handle server-side rendering without throwing errors.
 *
 * Supports configurable encoding/decoding (default URI encoding, base64, or custom).
 *
 * @example
 * ```typescript
 * constructor(private cookieService: CookieService) {
 *   // Set a cookie
 *   this.cookieService.set('theme', 'dark', { days: 30, secure: true });
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
export class CookieService {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly encoder = inject(StorageEncoderService);

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
  public set(name: string, value: string, options: CookieOptions = {}, skipEncoding: boolean = false): void {
    try {
      const { expires = 7, path = '/', secure = false, sameSite = 'Strict' } = options;
      const expirationDate = expires instanceof Date ? expires : new Date(Date.now() + expires * 86400000);
      const expiresString = expirationDate.toUTCString();
      const encodedValue = this.encoder.encode(value, 'cookies', skipEncoding, true);
      let cookieString = `${name}=${encodedValue}; expires=${expiresString}; path=${path}`;
      if (secure) cookieString += '; secure';
      if (sameSite) cookieString += `; samesite=${sameSite}`;
      this.document.cookie = cookieString;
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
  public setIfNotExists(name: string, value: string, options: CookieOptions = {}): void {
    const existingCookie = this.get(name);
    if (!existingCookie) {
      this.set(name, value, options);
    }
  }

  /**
   * Retrieves a cookie value by name.
   *
   * @param name - The cookie name.
   * @param skipDecoding - If true, skip decoding (useful for backend-set cookies).
   * @returns The decoded cookie value, or `null` if not found or in SSR context.
   *
   * @example
   * ```typescript
   * const userId = this.cookieService.get('userId');
   * if (userId) {
   *   console.log('User ID:', userId);
   * }
   * ```
   */
  public get(name: string, skipDecoding: boolean = false): string | null {
    try {
      const cookies = this.document.cookie ? this.document.cookie.split('; ') : [];
      const cookie = cookies.find(row => row.startsWith(name + '='));
      return cookie ? this.encoder.decode(cookie.split('=')[1], 'cookies', skipDecoding, true, 'cookie') : null;
    } catch (error) {
      console.error(`Failed to get cookie "${name}":`, error);
      return null;
    }
  }

  /**
   * Retrieves all cookies as a key-value object.
   *
   * @returns An object containing all cookies, or an empty object in SSR context.
   *
   * @example
   * ```typescript
   * const allCookies = this.cookieService.getAll();
   * console.log('All cookies:', allCookies);
   * ```
   */
  public getAll(): Record<string, string> {
    try {
      const cookies = this.document.cookie ? this.document.cookie.split('; ') : [];
      const cookieObject: Record<string, string> = {};
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        if (name && value) {
          cookieObject[name] = this.encoder.decode(value, 'cookies', false, true, 'cookie');
        }
      });
      return cookieObject;
    } catch (error) {
      console.error('Failed to get all cookies:', error);
      return {};
    }
  }

  /**
   * Retrieves and parses a JSON value from a cookie.
   *
   * @template T - The expected type of the parsed object.
   * @param name - The cookie name.
   * @param defaultValue - The default value if cookie not found or JSON parsing fails.
   * @returns The parsed object or the default value.
   *
   * @example
   * ```typescript
   * interface UserPrefs {
   *   theme: string;
   *   notifications: boolean;
   * }
   *
   * const prefs = this.cookieService.getJson<UserPrefs>('preferences', {
   *   theme: 'light',
   *   notifications: true
   * });
   * ```
   */
  public getJson<T>(name: string, defaultValue: T): T {
    const value = this.get(name);
    try {
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse JSON for cookie "${name}":`, error);
      return defaultValue;
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
  public setJson<T>(name: string, value: T, options: CookieOptions = {}): void {
    try {
      this.set(name, JSON.stringify(value), options);
    } catch (error) {
      console.error(`Failed to stringify JSON for cookie "${name}":`, error);
    }
  }

  /**
   * Retrieves and parses an array from a cookie.
   *
   * @template T - The expected type of array elements.
   * @param name - The cookie name.
   * @param defaultValue - The default array if cookie not found or parsing fails.
   * @returns The parsed array or the default value.
   */
  public getArray<T>(name: string, defaultValue: T[] = []): T[] {
    const value = this.get(name);
    try {
      const parsed = value ? JSON.parse(value) : defaultValue;
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (error) {
      console.error(`Failed to parse array for cookie "${name}":`, error);
      return defaultValue;
    }
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
  public setArray<T>(name: string, value: T[], options: CookieOptions = {}): void {
    this.setJson(name, value, options);
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
  public updateJson<T extends Record<string, unknown>>(
    name: string,
    updates: Partial<T>,
    defaultValue: T,
    options: CookieOptions = {}
  ): void {
    const current = this.getJson<T>(name, defaultValue);
    this.setJson(name, { ...current, ...updates }, options);
  }

  /**
   * Retrieves a value with validation against allowed values and fallback to default.
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value if cookie not found or value is invalid.
   * @param allowedValues - Array of allowed values. If empty, any value is accepted.
   * @param options - Optional cookie configuration for setting default.
   * @returns The cookie value if valid, otherwise the default value.
   */
  public getWithDefault(
    name: string,
    defaultValue: string,
    allowedValues: string[] = [],
    options: CookieOptions = {}
  ): string {
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
   * Retrieves a boolean value from a cookie.
   *
   * Recognizes common boolean string representations:
   * - Truthy: 'true', '1', 'yes', 'on'
   * - Falsy: 'false', '0', 'no', 'off'
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value if cookie not found or value is invalid.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed boolean value or the default.
   */
  public getBoolean(name: string, defaultValue: boolean, options: CookieOptions = {}): boolean {
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
   * Retrieves a numeric value from a cookie.
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value if cookie not found or value is not a valid number.
   * @param options - Optional cookie configuration for setting default.
   * @returns The parsed number or the default.
   */
  public getNumber(name: string, defaultValue: number, options: CookieOptions = {}): number {
    const value = this.get(name);
    const parsed = parseFloat(value || '');
    if (Number.isNaN(parsed)) {
      this.set(name, defaultValue.toString(), options);
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Retrieves an enum value from a cookie with type safety.
   *
   * @template T - The enum type (must extend string).
   * @param name - The cookie name.
   * @param defaultValue - The default enum value if cookie not found or value is invalid.
   * @param enumValues - Array of valid enum values for validation.
   * @param options - Optional cookie configuration for setting default.
   * @returns The cookie enum value if valid, otherwise the default.
   */
  public getEnum<T extends string>(
    name: string,
    defaultValue: T,
    enumValues: readonly T[],
    options: CookieOptions = {}
  ): T {
    const value = this.get(name);

    if (typeof value === 'string' && enumValues.includes(value as T)) {
      return value as T;
    }

    this.set(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Gets a cookie value or sets it to the default if it doesn't exist (atomic operation).
   *
   * @param name - The cookie name.
   * @param defaultValue - The default value to set and return if cookie doesn't exist.
   * @param options - Optional cookie configuration for setting default.
   * @returns The existing cookie value or the default value.
   */
  public getOrSet(name: string, defaultValue: string, options: CookieOptions = {}): string {
    const value = this.get(name);
    if (value !== null) {
      return value;
    }
    this.set(name, defaultValue, options);
    return defaultValue;
  }

  /**
   * Checks if a cookie exists.
   *
   * @param name - The cookie name to check.
   * @returns `true` if the cookie exists, `false` otherwise or in SSR context.
   */
  public has(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Deletes multiple cookies at once.
   *
   * Safe to call during SSR (no-op).
   *
   * @param names - Array of cookie names to delete.
   * @param path - The path of the cookies to delete. Default: '/'.
   */
  public deleteMany(names: string[], path: string = '/'): void {
    for (const name of names) {
      this.delete(name, path);
    }
  }

  /**
   * Gets all cookie names.
   *
   * @returns Array of all cookie names, or empty array in SSR context.
   */
  public keys(): string[] {
    try {
      const cookies = this.document.cookie ? this.document.cookie.split('; ') : [];
      return cookies.map(cookie => cookie.split('=')[0]).filter(Boolean);
    } catch (error) {
      console.error('Failed to get cookie keys:', error);
      return [];
    }
  }

  /**
   * Gets all cookie values.
   *
   * @returns Array of all cookie values, or empty array in SSR context.
   */
  public values(): (string | null)[] {
    return this.keys().map(key => this.get(key));
  }

  /**
   * Gets all cookie entries as key-value pairs.
   *
   * @returns Array of [name, value] tuples, or empty array in SSR context.
   */
  public entries(): [string, string | null][] {
    return this.keys().map(key => [key, this.get(key)] as [string, string | null]);
  }

  /**
   * Deletes all cookies.
   *
   * Note: This only deletes cookies accessible from the current path.
   * Cookies with different paths may require explicit deletion.
   * Safe to call during SSR (no-op).
   *
   * @param path - The path of the cookies to delete. Default: '/'.
   */
  public clear(path: string = '/'): void {
    try {
      const cookieNames = this.keys();
      for (const name of cookieNames) {
        this.delete(name, path);
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
   * @param path - The path of the cookie to delete. Default: '/'.
   *
   * @example
   * ```typescript
   * this.cookieService.delete('sessionId');
   * // Or with specific path
   * this.cookieService.delete('sessionId', '/app');
   * ```
   */
  public delete(name: string, path: string = '/'): void {
    try {
      // Set expiration to past date to delete the cookie
      this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    } catch (error) {
      console.error(`Failed to delete cookie "${name}":`, error);
    }
  }
}
