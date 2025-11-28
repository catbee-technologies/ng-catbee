import { isPlatformBrowser } from '@angular/common';
import { Injectable } from '@angular/core';
import { BaseStorageService } from './base-storage.service';

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
 * import { SessionStorageService } from '@catbee/storage';
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
export class SessionStorageService extends BaseStorageService {
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
