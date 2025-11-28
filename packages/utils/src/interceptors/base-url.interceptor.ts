import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Configuration for the base URL interceptor.
 *
 * @publicApi
 */
export interface BaseUrlInterceptorConfig {
  /** Base URL to prepend to relative URLs */
  baseUrl: string;
  /** URLs to exclude from base URL prepending */
  excludeUrls?: string[];
  /** Whether to only apply to relative URLs (default: true) */
  onlyRelative?: boolean;
}

/**
 * Creates an HTTP interceptor that prepends a base URL to requests.
 *
 * This interceptor automatically adds a base URL to relative HTTP requests,
 * making it easier to work with different environments and API endpoints.
 *
 * @param config - Configuration for the base URL interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createBaseUrlInterceptor } from '@ng-catbee/utils';
 * import { environment } from './environments/environment';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createBaseUrlInterceptor({
 *           baseUrl: environment.apiUrl,
 *           excludeUrls: ['assets/', 'http']
 *         })
 *       ])
 *     )
 *   ]
 * };
 *
 * // Now you can use relative URLs:
 * // http.get('/users') -> GET https://api.example.com/users
 * ```
 *
 * @publicApi
 */
export function createBaseUrlInterceptor(config: BaseUrlInterceptorConfig): HttpInterceptorFn {
  const { baseUrl, excludeUrls = [], onlyRelative = true } = config;

  // Remove trailing slash from base URL
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return (req, next) => {
    const url = req.url;

    // Check if URL should be excluded
    if (excludeUrls.some(excludeUrl => url.includes(excludeUrl))) {
      return next(req);
    }

    // Check if URL is absolute
    const isAbsolute = url.startsWith('http://') || url.startsWith('https://');

    // Skip if only processing relative URLs and this is absolute
    if (onlyRelative && isAbsolute) {
      return next(req);
    }

    // Don't modify if already has the base URL
    if (url.startsWith(normalizedBaseUrl)) {
      return next(req);
    }

    // Prepend base URL
    const newUrl = url.startsWith('/') ? `${normalizedBaseUrl}${url}` : `${normalizedBaseUrl}/${url}`;

    const modifiedReq = req.clone({ url: newUrl });
    return next(modifiedReq);
  };
}
