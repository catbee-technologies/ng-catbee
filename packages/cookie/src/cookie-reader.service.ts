/**
 * Abstract base class for cookie read operations.
 * Provides common read-only functionality for both browser and SSR cookie services.
 *
 * @internal
 */
export abstract class CookieReaderService {
  /**
   * Gets the raw cookie string from the appropriate source (document.cookie or request headers).
   */
  protected abstract getCookieString(): string | null;

  /**
   * Checks if running in the appropriate environment (browser/server).
   */
  protected abstract get isAvailable(): boolean;

  /**
   * Retrieves a cookie value by name.
   *
   * @param name - The cookie name.
   * @returns The decoded cookie value, or `null` if not found.
   */
  public get(name: string): string | null {
    if (!this.isAvailable) return null;
    try {
      const cookieStr = this.getCookieString();
      const cookies = cookieStr ? cookieStr.split('; ') : [];
      const cookie = cookies.find(row => row.startsWith(name + '='));
      return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : null;
    } catch (error) {
      console.error(`Failed to get cookie "${name}":`, error);
      return null;
    }
  }

  /**
   * Gets all cookie names.
   *
   * @returns Array of all cookie names.
   */
  public keys(): string[] {
    if (!this.isAvailable) return [];
    try {
      const cookieStr = this.getCookieString();
      const cookies = cookieStr ? cookieStr.split('; ') : [];
      return cookies.map(cookie => cookie.split('=')[0]).filter(Boolean);
    } catch (error) {
      console.error('Failed to get cookie keys:', error);
      return [];
    }
  }

  /**
   * Retrieves all cookies as a key-value object.
   *
   * @returns An object containing all cookies.
   */
  public getAll(): Record<string, string> {
    if (!this.isAvailable) return {};
    try {
      const cookieStr = this.getCookieString();
      const cookies = cookieStr ? cookieStr.split('; ') : [];
      const cookieObject: Record<string, string> = {};
      cookies.forEach(cookie => {
        const [name, ...valueParts] = cookie.split('=');
        const value = valueParts.join('=');
        if (name && value) {
          cookieObject[name] = decodeURIComponent(value);
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
   */
  public getJson<T>(name: string): T | null {
    if (!this.isAvailable) return null;
    const value = this.get(name);
    try {
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to parse JSON for cookie "${name}":`, error);
      return null;
    }
  }

  /**
   * Retrieves and parses an array from a cookie.
   */
  public getArray<T>(name: string): T[] | null {
    if (!this.isAvailable) return null;
    const value = this.get(name);
    try {
      const parsed = value ? JSON.parse(value) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.error(`Failed to parse array for cookie "${name}":`, error);
      return null;
    }
  }

  /**
   * Retrieves a boolean value from a cookie.
   */
  public getBoolean(name: string): boolean {
    if (!this.isAvailable) return false;
    const value = this.get(name)?.toLowerCase() || '';
    if (['true', '1', 'yes', 'on'].includes(value)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(value)) {
      return false;
    }
    return false;
  }

  /**
   * Retrieves a numeric value from a cookie.
   * Returns NaN if the value is not a valid number.
   */
  public getNumber(name: string): number {
    if (!this.isAvailable) return Number.NaN;
    const value = this.get(name);
    const parsed = Number.parseFloat(value || '');
    if (Number.isNaN(parsed)) {
      return Number.NaN;
    }
    return parsed;
  }

  /**
   * Retrieves an enum value from a cookie with type safety.
   */
  public getEnum<T extends string>(name: string, enumValues: readonly T[]): T | null {
    if (!this.isAvailable) return null;
    const value = this.get(name);

    if (typeof value === 'string' && enumValues.includes(value as T)) {
      return value as T;
    }

    return null;
  }

  /**
   * Checks if a cookie exists.
   */
  public has(name: string): boolean {
    if (!this.isAvailable) return false;
    return this.get(name) !== null;
  }

  /**
   * Gets all cookie values.
   */
  public values(): (string | null)[] {
    if (!this.isAvailable) return [];
    return this.keys().map(key => this.get(key));
  }

  /**
   * Gets all cookie entries as key-value pairs.
   */
  public entries(): [string, string | null][] {
    if (!this.isAvailable) return [];
    return this.keys().map(key => [key, this.get(key)] as [string, string | null]);
  }
}
