/**
 * Options for setting cookies.
 *
 * @public
 */
export interface CookieOptions {
  /** Expiration date or number of days until the cookie expires. Default: 7 days */
  expires?: Date | number;
  /** Cookie path. Default: '/' */
  path?: string;
  /** Whether the cookie should only be sent over HTTPS. Default: false */
  secure?: boolean;
  /** SameSite attribute for CSRF protection. Default: 'Strict' */
  sameSite?: 'Lax' | 'Strict' | 'None';
}
