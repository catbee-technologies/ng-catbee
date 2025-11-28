import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer } from 'rxjs';

/**
 * Configuration for the retry interceptor.
 *
 * @publicApi
 */
export interface RetryInterceptorConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponentialBackoff?: boolean;
  /** HTTP status codes to retry (default: [408, 429, 500, 502, 503, 504]) */
  retryOnStatus?: number[];
  /** HTTP methods to retry (default: ['GET', 'HEAD', 'OPTIONS']) */
  retryOnMethods?: string[];
  /** URLs to include for retry logic */
  includeUrls?: string[];
  /** URLs to exclude from retry logic */
  excludeUrls?: string[];
}

/**
 * Creates an HTTP interceptor that automatically retries failed requests.
 *
 * This interceptor implements smart retry logic with exponential backoff for failed HTTP requests.
 * It's particularly useful for handling transient network errors and server timeouts.
 *
 * @param config - Configuration for the retry interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createRetryInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createRetryInterceptor({
 *           maxRetries: 3,
 *           retryDelay: 1000,
 *           exponentialBackoff: true
 *         })
 *       ])
 *     )
 *   ]
 * };
 *
 * // Custom retry for specific endpoints
 * createRetryInterceptor({
 *   maxRetries: 5,
 *   retryDelay: 2000,
 *   includeUrls: ['/api/critical']
 * })
 * ```
 *
 * @publicApi
 */
export function createRetryInterceptor(config: RetryInterceptorConfig = {}): HttpInterceptorFn {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    retryOnStatus = [408, 429, 500, 502, 503, 504],
    retryOnMethods = ['GET', 'HEAD', 'OPTIONS'],
    includeUrls = [],
    excludeUrls = []
  } = config;

  return (req, next) => {
    // Check if URL should be excluded
    if (excludeUrls.length > 0 && excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Check if URL should be included (if includeUrls is specified)
    if (includeUrls.length > 0 && !includeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Check if method is retryable
    if (!retryOnMethods.includes(req.method.toUpperCase())) {
      return next(req);
    }

    return next(req).pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          // Only retry on specific status codes
          if (error instanceof HttpErrorResponse && !retryOnStatus.includes(error.status)) {
            throw error;
          }

          // Calculate delay with exponential backoff
          const delay = exponentialBackoff ? retryDelay * Math.pow(2, retryCount - 1) : retryDelay;

          console.log(`Retrying request (${retryCount}/${maxRetries}) to ${req.url} after ${delay}ms...`);

          return timer(delay);
        }
      })
    );
  };
}
