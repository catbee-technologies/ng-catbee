import { isPlatformServer } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, REQUEST } from '@angular/core';
import { CookieReaderService } from './cookie-reader.service';

/**
 * Server-side cookie service for SSR applications.
 *
 * This service handles reading cookies during server-side rendering by accessing
 * the Express Request object. It extends the base cookie service to provide
 * read-only cookie operations during SSR.
 *
 * Note: Write operations (set, delete, etc.) are no-ops during SSR as cookies
 * should be set on the client side. This service is primarily for reading cookies
 * that were sent with the initial request.
 *
 * @example
 * ```typescript
 * constructor(private ssrCookieService: SsrCookieService) {
 *   // Get a cookie during SSR
 *   const theme = this.ssrCookieService.get('theme');
 *
 *   // Get all cookies during SSR
 *   const allCookies = this.ssrCookieService.getAll();
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class SsrCookieService extends CookieReaderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject<{ headers: Headers }>(REQUEST, { optional: true });

  protected get isAvailable(): boolean {
    return isPlatformServer(this.platformId) && !!this.request;
  }

  /**
   * Gets the raw cookie string from the HTTP request headers.
   */
  protected getCookieString(): string | null {
    return this.request?.headers.get('cookie') ?? null;
  }
}
