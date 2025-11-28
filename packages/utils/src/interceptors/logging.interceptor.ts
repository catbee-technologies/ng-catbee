import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { LoggerService } from '@ng-catbee/utils/logger';

/**
 * Configuration for the logging interceptor.
 *
 * @publicApi
 */
export interface LoggingInterceptorConfig {
  /** Whether to log request details */
  logRequests?: boolean;
  /** Whether to log response details */
  logResponses?: boolean;
  /** Whether to log errors */
  logErrors?: boolean;
  /** Whether to log request/response timing */
  logTiming?: boolean;
  /** URLs to exclude from logging */
  excludeUrls?: string[];
  /** Custom logger service (optional, uses LoggerService by default) */
  logger?: LoggerService;
}

/**
 * Creates an HTTP interceptor that logs HTTP requests, responses, and errors.
 *
 * This interceptor helps with debugging and monitoring HTTP traffic in your application.
 * It supports detailed logging of requests, responses, errors, and timing information.
 *
 * @param config - Configuration for the logging interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createLoggingInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createLoggingInterceptor({
 *           logRequests: true,
 *           logResponses: true,
 *           logTiming: true,
 *           excludeUrls: ['/api/health']
 *         })
 *       ])
 *     )
 *   ]
 * };
 * ```
 *
 * @publicApi
 */
export function createLoggingInterceptor(config: LoggingInterceptorConfig = {}): HttpInterceptorFn {
  const { logRequests = true, logResponses = true, logErrors = true, logTiming = true, excludeUrls = [] } = config;

  return (req, next) => {
    const logger = config.logger ?? inject(LoggerService);

    // Check if URL should be excluded
    if (excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    const startTime = performance.now();
    const method = req.method;
    const url = req.url;

    // Log request
    if (logRequests) {
      logger.debug(`HTTP ${method} ${url}`, {
        method,
        url,
        headers: req.headers,
        body: req.body
      });
    }

    return next(req).pipe(
      tap({
        next: event => {
          if (event instanceof HttpResponse) {
            const duration = performance.now() - startTime;

            if (logResponses) {
              logger.info(`HTTP ${method} ${url} - ${event.status}`, {
                status: event.status,
                statusText: event.statusText,
                body: event.body,
                ...(logTiming && { duration: `${duration.toFixed(2)}ms` })
              });
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          const duration = performance.now() - startTime;

          if (logErrors) {
            logger.error(`HTTP ${method} ${url} - ${error.status}`, {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error,
              ...(logTiming && { duration: `${duration.toFixed(2)}ms` })
            });
          }
        }
      })
    );
  };
}
