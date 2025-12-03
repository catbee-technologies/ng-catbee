import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { CatbeeBaseStorageService } from './base-storage.service';

/**
 * Service for safe localStorage operations with SSR support.
 *
 * This service provides a type-safe wrapper around the browser's localStorage API
 * with automatic SSR handling. All methods are safe to call during server-side rendering
 * and will return appropriate defaults without throwing errors.
 *
 * Supports configurable encoding/decoding (default: no encoding, base64, or custom).
 *
 * @example
 * ```typescript
 * import { CatbeeLocalStorageService } from '@ng-catbee/storage';
 *
 * constructor(private localStorage: CatbeeLocalStorageService) {
 *   // Simple storage
 *   this.localStorage.set('theme', 'dark');
 *
 *   // Type-safe retrieval with defaults
 *   const theme = this.localStorage.get('theme') ?? 'light';
 *   const count = this.localStorage.getNumber('count', 0);
 *   const enabled = this.localStorage.getBoolean('enabled', true);
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class CatbeeLocalStorageService extends CatbeeBaseStorageService {
  protected getStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.localStorage : null;
  }

  protected getStorageName(): string {
    return 'localStorage';
  }

  protected getStorageType(): 'localStorage' | 'sessionStorage' {
    return 'localStorage';
  }
}

/**
 * Public alias for the `CatbeeLocalStorageService` used across the Catbee Storage module.
 *
 * This export re-exports the underlying localStorage wrapper service to provide
 * a clean, short, and consistent public API name for consumers.
 *
 * @alias LocalStorageService
 * @see CatbeeLocalStorageService
 *
 * @example
 * ```ts
 * import { LocalStorageService } from '@ng-catbee/storage';
 *
 * constructor(private localStorage: LocalStorageService) {
 *   this.localStorage.set('theme', 'dark');
 *
 *   const theme = this.localStorage.get('theme');
 *   const count = this.localStorage.getNumber('count', 0);
 *   const enabled = this.localStorage.getBoolean('enabled', true);
 * }
 * ```
 *
 * @public
 */
export const LocalStorageService = CatbeeLocalStorageService;
