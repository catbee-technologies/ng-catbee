/**
 * Options for setting cookies.
 *
 * @public
 */
export interface CookieOptions {
  /** Expiration date or number of days from now. Default: session cookie */
  expires?: Date | number;
  /** Cookie path. Default: '/' */
  path?: string;
  /** Cookie domain. Default: current domain */
  domain?: string;
  /** Whether the cookie should only be sent over HTTPS. Default: false */
  secure?: boolean;
  /** SameSite attribute for CSRF protection. Default: 'Lax' */
  sameSite?: 'Lax' | 'Strict' | 'None';
  /** Whether the cookie is partitioned. Default: false */
  partitioned?: boolean;
}
