import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Configuration for the headers interceptor.
 *
 * @publicApi
 */
export interface HeadersInterceptorConfig {
  /** Headers to add to requests */
  headers: Record<string, string | (() => string)>;
  /** URLs to exclude from adding headers */
  excludeUrls?: string[];
  /** URLs to include (if specified, only these will get headers) */
  includeUrls?: string[];
  /** Whether to override existing headers (default: false) */
  override?: boolean;
}

/**
 * Creates an HTTP interceptor that adds custom headers to requests.
 *
 * This interceptor allows you to add standard headers to all or specific HTTP requests,
 * such as API keys, content types, or custom application headers.
 *
 * @param config - Configuration for the headers interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createHeadersInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createHeadersInterceptor({
 *           headers: {
 *             'X-API-Key': 'your-api-key',
 *             'X-App-Version': '1.0.0',
 *             'X-Request-ID': () => crypto.randomUUID() // Dynamic header
 *           },
 *           excludeUrls: ['/public']
 *         })
 *       ])
 *     )
 *   ]
 * };
 * ```
 *
 * @publicApi
 */
export function createHeadersInterceptor(config: HeadersInterceptorConfig): HttpInterceptorFn {
  const { headers, excludeUrls = [], includeUrls = [], override = false } = config;

  return (req, next) => {
    // Check if URL should be excluded
    if (excludeUrls.length > 0 && excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Check if URL should be included (if includeUrls is specified)
    if (includeUrls.length > 0 && !includeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Build headers object
    const headersToSet: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      // Skip if header exists and override is false
      if (!override && req.headers.has(key)) {
        continue;
      }

      // Resolve header value (function or string)
      headersToSet[key] = typeof value === 'function' ? value() : value;
    }

    // Clone request with new headers
    const modifiedReq = req.clone({
      setHeaders: headersToSet
    });

    return next(modifiedReq);
  };
}
