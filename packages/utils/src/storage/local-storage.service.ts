import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { BaseStorageService } from '@ng-catbee/utils/common';

/**
 * Service for safe localStorage operations with SSR support.
 *
 * This service provides a type-safe wrapper around the browser's localStorage API
 * with automatic SSR handling. All methods are safe to call during server-side rendering
 * and will return appropriate defaults without throwing errors.
 *
 * Supports configurable encoding/decoding (default URI encoding, base64, or custom).
 *
 * @example
 * ```typescript
 * constructor(private localStorage: LocalStorageService) {
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
export class LocalStorageService extends BaseStorageService {
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
