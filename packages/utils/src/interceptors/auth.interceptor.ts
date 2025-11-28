import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

/**
 * Configuration for the authentication interceptor.
 *
 * @publicApi
 */
export interface AuthInterceptorConfig {
  /** Function to retrieve the authentication token */
  getToken: () => string | null | Promise<string | null>;
  /** Header name for the token (default: 'Authorization') */
  headerName?: string;
  /** Token prefix (default: 'Bearer') */
  tokenPrefix?: string;
  /** URLs to exclude from adding auth header */
  excludeUrls?: string[];
  /** URLs to include (if specified, only these will get auth header) */
  includeUrls?: string[];
}

/**
 * Creates an HTTP interceptor that adds authentication headers to requests.
 *
 * This interceptor automatically adds authentication tokens to outgoing HTTP requests.
 * It supports synchronous and asynchronous token retrieval, URL filtering, and custom headers.
 *
 * @param config - Configuration for the auth interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createAuthInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createAuthInterceptor({
 *           getToken: () => localStorage.getItem('auth_token'),
 *           excludeUrls: ['/api/public']
 *         })
 *       ])
 *     )
 *   ]
 * };
 *
 * // With async token retrieval
 * createAuthInterceptor({
 *   getToken: async () => {
 *     const session = await getSession();
 *     return session?.token ?? null;
 *   }
 * })
 * ```
 *
 * @publicApi
 */
export function createAuthInterceptor(config: AuthInterceptorConfig): HttpInterceptorFn {
  const { getToken, headerName = 'Authorization', tokenPrefix = 'Bearer', excludeUrls = [], includeUrls = [] } = config;

  return (req, next) => {
    // Check if URL should be excluded
    if (excludeUrls.length > 0 && excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Check if URL should be included (if includeUrls is specified)
    if (includeUrls.length > 0 && !includeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Get token (sync or async)
    const tokenResult = getToken();

    if (tokenResult instanceof Promise) {
      return from(tokenResult).pipe(
        switchMap(token => {
          const modifiedReq = token ? addAuthHeader(req, token, headerName, tokenPrefix) : req;
          return next(modifiedReq);
        })
      );
    }

    if (tokenResult) {
      req = addAuthHeader(req, tokenResult, headerName, tokenPrefix);
    }

    return next(req);
  };
}

/**
 * Helper function to add authentication header to request.
 */
function addAuthHeader(
  req: HttpRequest<unknown>,
  token: string,
  headerName: string,
  tokenPrefix: string
): HttpRequest<unknown> {
  const headerValue = tokenPrefix ? `${tokenPrefix} ${token}` : token;
  return req.clone({
    setHeaders: {
      [headerName]: headerValue
    }
  });
}
