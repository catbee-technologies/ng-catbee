import { CookiePriority, CookieSameSite } from './cookie.types';

/**
 * Custom encoding hook for cookie name/value.
 * @public
 */
export interface CookieBuilderEncodingOptions {
  /** Custom encoder for cookie name (default: encodeURIComponent). */
  readonly encodeName?: (name: string) => string;

  /** Custom encoder for cookie value (default: encodeURIComponent). */
  readonly encodeValue?: (value: string) => string;
}

/**
 * Fluent builder for generating RFC-compliant `Set-Cookie` strings.
 *
 * Ensures consistent ordering:
 * ```
 * name=value;
 * Expires=...;
 * Max-Age=...;
 * Domain=...;
 * Path=...;
 * Secure;
 * HttpOnly;
 * SameSite=...;
 * Partitioned;
 * Priority=...
 * ```
 *
 * Supports:
 * - SameSite=None → Auto-Secure enforcement
 * - CHIPS (`Partitioned`)
 * - Chrome Priority
 * - Custom encoding for name/value
 *
 * @example
 * ```ts
 * const cookie = CookieBuilder.create('session', 'abc123')
 *   .withPath('/')
 *   .withHttpOnly()
 *   .withSecure()
 *   .withSameSite('Strict')
 *   .withMaxAge(3600)
 *   .build();
 *
 * // "session=abc123; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Strict"
 * ```
 *
 * @public
 */
export class CookieBuilder {
  private name = '';
  private value = '';

  private expires?: Date;
  private maxAge?: number;
  private domain?: string;
  private path?: string;
  private secure = false;
  private httpOnly = false;
  private sameSite?: CookieSameSite;
  private partitioned = false;
  private priority?: CookiePriority;

  private readonly encodeName: (name: string) => string;
  private readonly encodeValue: (value: string) => string;

  private constructor(encoding?: CookieBuilderEncodingOptions) {
    this.encodeName = encoding?.encodeName ?? encodeURIComponent;
    this.encodeValue = encoding?.encodeValue ?? encodeURIComponent;
  }

  /**
   * Creates a new CookieBuilder instance.
   *
   * @param name - Cookie name (required, non-empty)
   * @param value - Cookie value (defaults to empty string)
   * @param encoding - Optional custom encoding strategies
   * @throws Error if name is empty or invalid
   */
  public static create(name: string, value = '', encoding?: CookieBuilderEncodingOptions): CookieBuilder {
    return new CookieBuilder(encoding).withName(name).withValue(value);
  }

  /**
   * Sets the cookie name.
   * @param name - Cookie name (required, non-empty after trimming)
   * @throws Error if name is empty, not a string, or only whitespace
   */
  public withName(name: string): this {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('Cookie name must be a non-empty string.');
    }
    this.name = name;
    return this;
  }

  /**
   * Sets the cookie value (empty string allowed).
   */
  public withValue(value: string): this {
    this.value = value ?? '';
    return this;
  }

  /**
   * Sets the expiration timestamp.
   *
   * @param expires - Date object or milliseconds from now
   * @throws Error if Date is invalid or number is not finite
   */
  public withExpires(expires: Date | number): this {
    if (expires instanceof Date) {
      if (Number.isNaN(expires.getTime())) {
        throw new Error('Invalid Date object provided for expires.');
      }
      this.expires = expires;
    } else {
      if (!Number.isFinite(expires)) {
        throw new Error('Expires must be a finite number of milliseconds.');
      }
      this.expires = new Date(Date.now() + expires);
    }
    return this;
  }

  /**
   * Sets Max-Age in seconds.
   *
   * @param seconds - Maximum age in seconds (must be finite, negative values set to 0)
   * @throws Error if seconds is not a finite number
   */
  public withMaxAge(seconds: number): this {
    if (!Number.isFinite(seconds)) {
      throw new Error('Max-Age must be a finite number.');
    }
    this.maxAge = Math.max(0, Math.floor(seconds));
    return this;
  }

  /**
   * Sets the Domain attribute.
   *
   * @param domain - Domain where the cookie is accessible
   */
  public withDomain(domain: string): this {
    this.domain = domain;
    return this;
  }

  /**
   * Sets the Path attribute.
   *
   * @param path - URL path where the cookie is accessible (defaults to current path)
   */
  public withPath(path: string): this {
    this.path = path;
    return this;
  }

  /**
   * Enables or disables the Secure flag.
   * When true, cookie is only sent over HTTPS.
   *
   * @param secure - Whether to set Secure flag (defaults to true)
   */
  public withSecure(secure = true): this {
    this.secure = secure;
    return this;
  }

  /**
   * Enables or disables the HttpOnly flag.
   * When true, cookie is inaccessible to JavaScript's Document.cookie API.
   *
   * @param httpOnly - Whether to set HttpOnly flag (defaults to true)
   */
  public withHttpOnly(httpOnly = true): this {
    this.httpOnly = httpOnly;
    return this;
  }

  /**
   * Sets the SameSite attribute.
   *
   * Note: Setting `SameSite=None` automatically forces `Secure=true`
   * due to browser security requirements.
   *
   * @param mode - SameSite mode ('Strict', 'Lax', or 'None')
   */
  public withSameSite(mode: CookieSameSite): this {
    this.sameSite = mode;

    // Enforce SameSite=None → Secure
    if (mode === 'None' && !this.secure) {
      this.secure = true;
      if (this.name) {
        console.warn(`Cookie "${this.name}" with SameSite=None automatically enabled Secure (required by browsers).`);
      }
    }
    return this;
  }

  /**
   * Enables CHIPS (Cookies Having Independent Partitioned State) `Partitioned` attribute.
   *
   * @param partitioned - Whether to set Partitioned flag (defaults to true)
   * @see https://developer.chrome.com/docs/privacy-sandbox/chips/
   */
  public withPartitioned(partitioned = true): this {
    this.partitioned = partitioned;
    return this;
  }

  /**
   * Sets the Priority attribute (Chrome-specific, non-standard).
   *
   * @param priority - Cookie priority ('Low', 'Medium', or 'High')
   */
  public withPriority(priority: CookiePriority): this {
    this.priority = priority;
    return this;
  }

  /**
   * Builds and returns the final RFC 6265 compliant cookie string.
   *
   * @returns Cookie string suitable for Set-Cookie header or document.cookie
   * @throws Error if cookie name is missing or empty
   */
  public build(): string {
    if (!this.name) {
      throw new Error('Cookie name is required. Use withName() or create() with a name.');
    }

    const segments: string[] = [];

    // name=value
    segments.push(`${this.encodeName(this.name)}=${this.encodeValue(this.value)}`);

    if (this.expires) segments.push(`Expires=${this.expires.toUTCString()}`);
    if (typeof this.maxAge === 'number') segments.push(`Max-Age=${this.maxAge}`);
    if (this.domain) segments.push(`Domain=${this.domain}`);
    if (this.path) segments.push(`Path=${this.path}`);
    if (this.secure) segments.push('Secure');
    if (this.httpOnly) segments.push('HttpOnly');
    if (this.sameSite) segments.push(`SameSite=${this.sameSite}`);
    if (this.partitioned) segments.push('Partitioned');
    if (this.priority) segments.push(`Priority=${this.priority}`);

    return segments.join('; ');
  }

  /**
   * Returns the built cookie string. Alias for `build()`.
   * Enables implicit string conversion.
   *
   * @returns Cookie string suitable for Set-Cookie header or document.cookie
   */
  public toString(): string {
    return this.build();
  }
}
