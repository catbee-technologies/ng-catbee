import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { timeout, TimeoutError } from 'rxjs';
import { catchError, throwError } from 'rxjs';

/**
 * Configuration for the timeout interceptor.
 *
 * @publicApi
 */
export interface TimeoutInterceptorConfig {
  /** Timeout duration in milliseconds (default: 30000) */
  timeoutDuration?: number;
  /** URLs to exclude from timeout */
  excludeUrls?: string[];
  /** Custom timeout durations per URL pattern */
  customTimeouts?: { pattern: string | RegExp; timeout: number }[];
}

/**
 * Creates an HTTP interceptor that adds timeout functionality to requests.
 *
 * This interceptor automatically cancels requests that take longer than the specified duration,
 * helping to prevent hanging requests and improve user experience.
 *
 * @param config - Configuration for the timeout interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createTimeoutInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createTimeoutInterceptor({
 *           timeoutDuration: 30000,
 *           customTimeouts: [
 *             { pattern: '/api/upload', timeout: 120000 }
 *           ]
 *         })
 *       ])
 *     )
 *   ]
 * };
 * ```
 *
 * @publicApi
 */
export function createTimeoutInterceptor(config: TimeoutInterceptorConfig = {}): HttpInterceptorFn {
  const { timeoutDuration = 30000, excludeUrls = [], customTimeouts = [] } = config;

  return (req, next) => {
    // Check if URL should be excluded
    if (excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Determine timeout duration
    let duration = timeoutDuration;

    for (const customTimeout of customTimeouts) {
      const pattern = customTimeout.pattern;
      const matches = typeof pattern === 'string' ? req.url.includes(pattern) : pattern.test(req.url);

      if (matches) {
        duration = customTimeout.timeout;
        break;
      }
    }

    return next(req).pipe(
      timeout(duration),
      catchError(error => {
        if (error instanceof TimeoutError) {
          console.error(`Request timeout after ${duration}ms: ${req.url}`);
          return throwError(
            () =>
              new HttpErrorResponse({
                error: 'Request timeout',
                status: 408,
                statusText: 'Request Timeout',
                url: req.url
              })
          );
        }
        return throwError(() => error);
      })
    );
  };
}
