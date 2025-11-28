import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LoggerService } from '@ng-catbee/utils/logger';

/**
 * Error handler function type.
 *
 * @publicApi
 */
export type ErrorHandler = (error: HttpErrorResponse) => void;

/**
 * Configuration for the error handler interceptor.
 *
 * @publicApi
 */
export interface ErrorHandlerInterceptorConfig {
  /** Custom error handler function */
  onError?: ErrorHandler;
  /** Whether to show user-friendly messages (default: true) */
  showUserMessages?: boolean;
  /** Custom error messages by status code */
  errorMessages?: Record<number, string>;
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
  /** URLs to exclude from error handling */
  excludeUrls?: string[];
}

/**
 * Default error messages by HTTP status code.
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request - The request was invalid.',
  401: 'Unauthorized - Please log in to continue.',
  403: 'Forbidden - You do not have permission to access this resource.',
  404: 'Not Found - The requested resource was not found.',
  408: 'Request Timeout - The request took too long to complete.',
  429: 'Too Many Requests - Please slow down and try again later.',
  500: 'Internal Server Error - Something went wrong on our end.',
  502: 'Bad Gateway - The server is temporarily unavailable.',
  503: 'Service Unavailable - The service is temporarily unavailable.',
  504: 'Gateway Timeout - The server took too long to respond.'
};

/**
 * Creates an HTTP interceptor that handles errors globally.
 *
 * This interceptor provides centralized error handling for HTTP requests,
 * with support for custom error handlers, user-friendly messages, and logging.
 *
 * @param config - Configuration for the error handler interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createErrorHandlerInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createErrorHandlerInterceptor({
 *           onError: (error) => {
 *             // Custom error handling
 *             if (error.status === 401) {
 *               router.navigate(['/login']);
 *             }
 *           },
 *           errorMessages: {
 *             401: 'Your session has expired. Please log in again.'
 *           }
 *         })
 *       ])
 *     )
 *   ]
 * };
 * ```
 *
 * @publicApi
 */
export function createErrorHandlerInterceptor(config: ErrorHandlerInterceptorConfig = {}): HttpInterceptorFn {
  const { onError, showUserMessages = true, errorMessages = {}, logErrors = true, excludeUrls = [] } = config;

  const messages = { ...DEFAULT_ERROR_MESSAGES, ...errorMessages };

  return (req, next) => {
    // Check if URL should be excluded
    if (excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const logger = inject(LoggerService, { optional: true });

        // Log error
        if (logErrors && logger) {
          logger.error(`HTTP Error: ${error.status} ${error.statusText}`, {
            url: req.url,
            method: req.method,
            status: error.status,
            message: error.message,
            error: error.error
          });
        }

        // Get user-friendly message
        if (showUserMessages) {
          const userMessage = messages[error.status] || 'An unexpected error occurred.';
          console.error(userMessage);
        }

        // Call custom error handler
        if (onError) {
          onError(error);
        }

        // Re-throw the error
        return throwError(() => error);
      })
    );
  };
}
