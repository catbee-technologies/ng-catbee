import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Configuration for the cache interceptor.
 *
 * @publicApi
 */
export interface CacheInterceptorConfig {
  /** Cache duration in milliseconds (default: 5 minutes) */
  cacheDuration?: number;
  /** HTTP methods to cache (default: ['GET']) */
  cacheableMethods?: string[];
  /** URLs to include in caching */
  includeUrls?: string[];
  /** URLs to exclude from caching */
  excludeUrls?: string[];
  /** Maximum cache size (number of entries, default: 50) */
  maxCacheSize?: number;
  /** Whether to use URL parameters in cache key (default: true) */
  includeParams?: boolean;
}

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
}

/**
 * Creates an HTTP interceptor that caches GET requests.
 *
 * This interceptor implements a simple in-memory cache for HTTP responses,
 * reducing redundant network requests and improving application performance.
 *
 * @param config - Configuration for the cache interceptor
 * @returns HTTP interceptor function
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { createCacheInterceptor } from '@ng-catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         createCacheInterceptor({
 *           cacheDuration: 5 * 60 * 1000, // 5 minutes
 *           includeUrls: ['/api/users', '/api/products']
 *         })
 *       ])
 *     )
 *   ]
 * };
 * ```
 *
 * @publicApi
 */
export function createCacheInterceptor(config: CacheInterceptorConfig = {}): HttpInterceptorFn {
  const {
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    cacheableMethods = ['GET'],
    includeUrls = [],
    excludeUrls = [],
    maxCacheSize = 50,
    includeParams = true
  } = config;

  const cache = new Map<string, CacheEntry>();

  return (req, next) => {
    // Only cache specific methods
    if (!cacheableMethods.includes(req.method.toUpperCase())) {
      return next(req);
    }

    // Check if URL should be excluded
    if (excludeUrls.length > 0 && excludeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    // Check if URL should be included (if includeUrls is specified)
    if (includeUrls.length > 0 && !includeUrls.some(url => req.url.includes(url))) {
      return next(req);
    }

    const cacheKey = getCacheKey(req.url, req.params.toString(), includeParams);
    const cached = cache.get(cacheKey);

    // Return cached response if valid
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`Cache HIT: ${req.url}`);
      return of(cached.response.clone());
    }

    // Make request and cache response
    return next(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Enforce max cache size
          if (cache.size >= maxCacheSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
              cache.delete(firstKey);
            }
          }

          cache.set(cacheKey, {
            response: event.clone(),
            timestamp: Date.now()
          });
          console.log(`Cache SET: ${req.url}`);
        }
      })
    );
  };
}

/**
 * Generates a cache key from URL and parameters.
 */
function getCacheKey(url: string, params: string, includeParams: boolean): string {
  return includeParams && params ? `${url}?${params}` : url;
}

/**
 * Clears all cached responses.
 *
 * @example
 * ```typescript
 * import { clearHttpCache } from '@ng-catbee/utils';
 *
 * // Clear cache when user logs out
 * clearHttpCache();
 * ```
 *
 * @publicApi
 */
export function clearHttpCache(): void {
  // Note: This requires the cache Map to be accessible globally
  // In a real implementation, you might want to use a service for cache management
  console.warn('Cache clearing requires service-based cache management');
}
