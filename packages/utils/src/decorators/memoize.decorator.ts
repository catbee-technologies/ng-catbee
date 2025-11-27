/**
 * Memoizes method results to cache and reuse return values for identical inputs.
 *
 * This decorator caches the result of a method based on its arguments. Subsequent calls
 * with the same arguments return the cached result instead of re-executing the method.
 *
 * @param options - Optional configuration for memoization.
 * @param options.maxCacheSize - Maximum number of cached results (default: 10).
 * @param options.resolver - Custom function to generate cache keys from arguments.
 * @returns Method decorator that memoizes the target method.
 *
 * @example
 * ```typescript
 * class CalculationService {
 *   @Memoize()
 *   expensiveCalculation(a: number, b: number): number {
 *     return a * b + Math.sqrt(a) * b;
 *   }
 *
 *   @Memoize({ maxCacheSize: 50 })
 *   fetchData(id: string): Observable<Data> {
 *     return this.http.get(`/api/data/${id}`);
 *   }
 * }
 * ```
 *
 * @public
 */
export function Memoize(options?: {
  maxCacheSize?: number;
  resolver?: (...args: unknown[]) => string;
}): MethodDecorator {
  const maxCacheSize = options?.maxCacheSize ?? 10;
  const resolver = options?.resolver;

  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map<string, unknown>();
    const cacheOrder: string[] = [];

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const cacheKey = resolver ? resolver(...args) : JSON.stringify(args);

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const result = originalMethod.apply(this, args);

      cache.set(cacheKey, result);
      cacheOrder.push(cacheKey);

      // Implement LRU cache eviction
      if (cacheOrder.length > maxCacheSize) {
        const oldestKey = cacheOrder.shift();
        if (oldestKey) {
          cache.delete(oldestKey);
        }
      }

      return result;
    };

    return descriptor;
  };
}
