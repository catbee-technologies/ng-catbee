import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { distinctUntilChanged, interval, map, of, take, takeWhile } from 'rxjs';

/**
 * Standard JWT payload interface with common claims.
 *
 * @public
 */
export interface JwtPayload {
  /** Issuer - identifies principal that issued the JWT */
  iss?: string;
  /** Subject - identifies the subject of the JWT */
  sub?: string;
  /** Audience - identifies the recipients that the JWT is intended for */
  aud?: string | string[];
  /** Expiration Time - identifies the expiration time on or after which the JWT must not be accepted */
  exp?: number;
  /** Not Before - identifies the time before which the JWT must not be accepted */
  nbf?: number;
  /** Issued At - identifies the time at which the JWT was issued */
  iat?: number;
  /** JWT ID - provides a unique identifier for the JWT */
  jti?: string;
  /** Custom claims */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Decoded JWT structure with header, payload, and signature.
 *
 * @public
 */
export interface DecodedJwt<T = JwtPayload> {
  /** JWT header containing algorithm and token type */
  header: {
    alg: string;
    typ: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  /** JWT payload with claims */
  payload: T;
  /** JWT signature (base64url encoded) */
  signature: string;
  /** Raw token string */
  raw: string;
}

/**
 * Service for decoding and validating JWT tokens.
 *
 * This service provides utilities for working with JWT tokens in Angular applications.
 * It handles decoding, validation, and expiration checking of JWT tokens.
 *
 * **Important:** This service only decodes JWTs - it does NOT verify signatures.
 * For production use, always verify JWT signatures on the backend.
 *
 * @example
 * ```typescript
 * import { JwtService } from '@ng-catbee/jwt';
 *
 * constructor(private jwtService: JwtService) {
 *   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 *
 *   // Decode the payload
 *   const payload = this.jwtService.decodePayload(token);
 *   if (payload) {
 *     console.log('User ID:', payload.sub);
 *   }
 *
 *   // Check if expired
 *   if (this.jwtService.isExpired(token)) {
 *     console.log('Token expired, please login again');
 *   }
 *
 *   // Get expiration date
 *   const expDate = this.jwtService.getExpirationDate(token);
 *   if (expDate) {
 *     console.log('Expires:', expDate.toLocaleString());
 *   }
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private readonly platformId = inject(PLATFORM_ID);
  /**
   * Decodes a JWT token and returns the payload.
   *
   * This method only decodes the JWT - it does NOT verify the signature.
   * For production use, always verify JWT signatures on the backend.
   *
   * @template T - The expected payload type (defaults to JwtPayload)
   * @param token - The JWT token string
   * @returns The decoded payload or null if decoding fails
   *
   * @example
   * ```typescript
   * interface CustomPayload extends JwtPayload {
   *   userId: string;
   *   role: string;
   * }
   *
   * const payload = this.jwtService.decodePayload<CustomPayload>(token);
   * if (payload) {
   *   console.log('User ID:', payload.userId);
   *   console.log('Role:', payload.role);
   * }
   * ```
   *
   * @public
   */
  decodePayload<T = JwtPayload>(token: string): T | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = this.splitToken(token);
      if (!parts) {
        if (isDevMode()) {
          console.error('Invalid JWT format: expected 3 parts');
        }
        return null;
      }

      const payloadBase64 = parts[1];
      const payloadJson = this.base64UrlDecode(payloadBase64);
      return JSON.parse(payloadJson) as T;
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to decode JWT payload:', error);
      }
      return null;
    }
  }

  /**
   * Decodes a complete JWT token including header, payload, and signature.
   *
   * This method only decodes the JWT - it does NOT verify the signature.
   *
   * @template T - The expected payload type (defaults to JwtPayload)
   * @param token - The JWT token string
   * @returns The decoded JWT object or null if decoding fails
   *
   * @example
   * ```typescript
   * const decoded = this.jwtService.decode(token);
   * if (decoded) {
   *   console.log('Algorithm:', decoded.header.alg);
   *   console.log('Expires:', new Date(decoded.payload.exp! * 1000));
   *   console.log('Subject:', decoded.payload.sub);
   * }
   * ```
   *
   * @public
   */
  decode<T = JwtPayload>(token: string): DecodedJwt<T> | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = this.splitToken(token);
      if (!parts) {
        if (isDevMode()) {
          console.error('Invalid JWT format: expected 3 parts');
        }
        return null;
      }

      const [headerBase64, payloadBase64, signature] = parts;

      const headerJson = this.base64UrlDecode(headerBase64);
      const payloadJson = this.base64UrlDecode(payloadBase64);

      return {
        header: JSON.parse(headerJson),
        payload: JSON.parse(payloadJson) as T,
        signature,
        raw: token
      };
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to decode JWT:', error);
      }
      return null;
    }
  }

  /**
   * Checks if a JWT token is expired based on the 'exp' claim.
   *
   * @param token - The JWT token string or decoded payload
   * @param offsetSeconds - Optional offset in seconds to check expiration early (default: 0)
   * @returns true if token is expired, false otherwise
   *
   * @example
   * ```typescript
   * // Check if token is expired
   * if (this.jwtService.isExpired(token)) {
   *   console.log('Token expired, please login again');
   * }
   *
   * // Check if token expires within 5 minutes (300 seconds)
   * if (this.jwtService.isExpired(token, 300)) {
   *   console.log('Token expiring soon, refresh it');
   * }
   * ```
   *
   * @public
   */
  isExpired(token: string | JwtPayload, offsetSeconds: number = 0): boolean {
    try {
      const payload = typeof token === 'string' ? this.decodePayload(token) : token;

      if (!payload || !payload?.exp) {
        return true; // No expiration claim = treat as expired for safety
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime + offsetSeconds;
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to check JWT expiration:', error);
      }
      return true; // On error, treat as expired for safety
    }
  }

  /**
   * Gets the remaining time until JWT expiration in seconds.
   *
   * @param token - The JWT token string or decoded payload
   * @returns Remaining seconds until expiration, or null if token is invalid or has no exp claim
   *
   * @example
   * ```typescript
   * const remaining = this.jwtService.getRemainingTime(token);
   * if (remaining !== null) {
   *   console.log(`Token expires in ${Math.floor(remaining / 60)} minutes`);
   * }
   * ```
   *
   * @public
   */
  getRemainingTime(token: string | JwtPayload): number | null {
    try {
      const payload = typeof token === 'string' ? this.decodePayload(token) : token;

      if (!payload || !payload?.exp) {
        return null;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = payload.exp - currentTime;
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to get JWT remaining time:', error);
      }
      return null;
    }
  }

  /**
   * Validates JWT format without decoding.
   * Checks if the token has the correct structure (3 parts separated by dots).
   *
   * @param token - The JWT token string to validate
   * @returns true if format is valid, false otherwise
   *
   * @example
   * ```typescript
   * if (this.jwtService.isValidFormat(token)) {
   *   const payload = this.jwtService.decodePayload(token);
   * }
   * ```
   *
   * @public
   */
  isValidFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = this.splitToken(token);
    if (!parts) {
      return false;
    }

    // Check if all parts are non-empty and valid base64url
    return parts.every(part => {
      if (!part || part.length === 0) {
        return false;
      }
      // Basic base64url character check
      return /^[A-Za-z0-9_-]+$/.test(part);
    });
  }

  /**
   * Extracts a specific claim from the JWT payload.
   *
   * @template T - The expected type of the claim value
   * @param token - The JWT token string
   * @param claim - The claim name to extract
   * @returns The claim value or null if not found
   *
   * @example
   * ```typescript
   * const userId = this.jwtService.getClaim<string>(token, 'sub');
   * const roles = this.jwtService.getClaim<string[]>(token, 'roles');
   * ```
   *
   * @public
   */
  getClaim<T = unknown>(token: string, claim: string): T | null {
    const payload = this.decodePayload(token);
    return payload && claim in payload ? (payload[claim] as T) : null;
  }

  /**
   * Gets the expiration date of a JWT token.
   *
   * @param token - The JWT token string or decoded payload
   * @returns Date object representing expiration time, or null if no exp claim
   *
   * @example
   * ```typescript
   * const expDate = this.jwtService.getExpirationDate(token);
   * if (expDate) {
   *   console.log('Expires on:', expDate.toLocaleString());
   * }
   * ```
   *
   * @public
   */
  getExpirationDate(token: string | JwtPayload): Date | null {
    try {
      const payload = typeof token === 'string' ? this.decodePayload(token) : token;

      if (!payload || !payload?.exp) {
        return null;
      }

      return new Date(payload.exp * 1000);
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to get JWT expiration date:', error);
      }
      return null;
    }
  }

  /**
   * Gets the issued at date of a JWT token.
   *
   * @param token - The JWT token string or decoded payload
   * @returns Date object representing issued at time, or null if no iat claim
   *
   * @example
   * ```typescript
   * const issuedDate = this.jwtService.getIssuedDate(token);
   * if (issuedDate) {
   *   console.log('Issued on:', issuedDate.toLocaleString());
   * }
   * ```
   *
   * @public
   */
  getIssuedDate(token: string | JwtPayload): Date | null {
    try {
      const payload = typeof token === 'string' ? this.decodePayload(token) : token;

      if (!payload || !payload?.iat) {
        return null;
      }

      return new Date(payload.iat * 1000);
    } catch (error) {
      if (isDevMode()) {
        console.error('Failed to get JWT issued date:', error);
      }
      return null;
    }
  }

  /**
   * Watches the remaining time until JWT expiration.
   *
   * Emits the remaining time in seconds at specified intervals until expiration.
   *
   * @param token - The JWT token string
   * @param tickMs - Interval in milliseconds to emit remaining time (default: 1000ms)
   * @returns Observable that emits remaining seconds until expiration
   *
   * @example
   * ```typescript
   * this.jwtService.watchExpiry(token).subscribe(remaining => {
   *   console.log(`Token expires in ${remaining} seconds`);
   * });
   * ```
   *
   * @public
   */
  watchExpiry(token: string, tickMs = 1000) {
    const payload = this.decodePayload(token);
    if (!payload || !payload?.exp) return of(0).pipe(take(1));

    const expirationTime = payload.exp;
    return interval(tickMs).pipe(
      map(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const remaining = expirationTime - currentTime;
        return remaining > 0 ? remaining : 0;
      }),
      distinctUntilChanged(),
      takeWhile(v => v > 0)
    );
  }

  /**
   * Decodes a base64url encoded string.
   *
   * @param base64Url - The base64url encoded string
   * @returns The decoded string
   *
   * @internal
   */
  private base64UrlDecode(base64Url: string): string {
    // Replace base64url characters with base64 characters
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Fix padding
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('Invalid base64url input');
      }
      base64 += '='.repeat(4 - pad);
    }

    /** ---------------- SSR (Node) Decode ---------------- */
    if (isPlatformServer(this.platformId)) {
      try {
        return Buffer.from(base64, 'base64').toString('utf-8');
      } catch {
        return Buffer.from(base64, 'base64').toString(); // byte fallback
      }
    }

    /** ---------------- Browser Decode ------------------ */
    if (isPlatformBrowser(this.platformId)) {
      const decoded = atob(base64);
      try {
        return decodeURIComponent(
          decoded
            .split('')
            .map(c => '%' + ('00' + c.codePointAt(0)!.toString(16)).slice(-2))
            .join('')
        );
      } catch {
        return decoded; // raw ASCII fallback
      }
    }
    throw new Error('Unsupported platform for base64 decoding');
  }

  /**
   * Splits a JWT token into its three parts.
   *
   * @param token - The JWT token string
   * @returns An array containing the header, payload, and signature, or null if invalid
   *
   * @internal
   */
  private splitToken(token: string): [string, string, string] | null {
    const parts = token.split('.');
    return parts.length === 3 ? (parts as [string, string, string]) : null;
  }
}
