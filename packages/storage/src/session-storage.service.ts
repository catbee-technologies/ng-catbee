import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { CatbeeBaseStorageService } from './base-storage.service';

/**
 * Service for safe sessionStorage operations with SSR support.
 *
 * This service provides a type-safe wrapper around the browser's sessionStorage API
 * with automatic SSR handling. All methods are safe to call during server-side rendering
 * and will return appropriate defaults without throwing errors.
 *
 * Supports configurable encoding/decoding (default: no encoding, base64, or custom).
 *
 * @example
 * ```typescript
 * import { SessionStorageService } from '@ng-catbee/storage';
 *
 * constructor(private sessionStorage: SessionStorageService) {
 *   // Simple storage
 *   this.sessionStorage.set('theme', 'dark');
 *
 *   // Type-safe retrieval with defaults
 *   const theme = this.sessionStorage.get('theme') ?? 'light';
 *   const count = this.sessionStorage.getNumber('count', 0);
 *   const enabled = this.sessionStorage.getBoolean('enabled', true);
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class CatbeeSessionStorageService extends CatbeeBaseStorageService {
  protected getStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.sessionStorage : null;
  }

  protected getStorageName(): string {
    return 'sessionStorage';
  }

  protected getStorageType(): 'localStorage' | 'sessionStorage' {
    return 'sessionStorage';
  }
}

/**
 * Public alias for the `CatbeeSessionStorageService` used across the Catbee Storage module.
 *
 * This export re-exports the underlying sessionStorage wrapper service to provide
 * a clean, short, and consistent public API name for consumers.
 *
 * @alias SessionStorageService
 * @see CatbeeSessionStorageService
 *
 * @example
 * ```ts
 * import { SessionStorageService } from '@ng-catbee/storage';
 *
 * constructor(private sessionStorage: SessionStorageService) {
 *   this.sessionStorage.set('theme', 'dark');
 *
 *   const theme = this.sessionStorage.get('theme');
 *   const count = this.sessionStorage.getNumber('count', 0);
 *   const enabled = this.sessionStorage.getBoolean('enabled', true);
 * }
 * ```
 *
 * @public
 */
export const SessionStorageService = CatbeeSessionStorageService;
