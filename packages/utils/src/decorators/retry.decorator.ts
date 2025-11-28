/**
 * Configuration options for the Retry decorator.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  delay?: number;
  /** Exponential backoff multiplier (default: 1, no backoff) */
  backoff?: number;
  /** Custom function to determine if error should trigger retry */
  shouldRetry?: (error: unknown) => boolean;
  /** Callback invoked on each retry attempt */
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Automatically retries a failed method with configurable options.
 *
 * This decorator wraps async methods and retries them when they throw errors,
 * with support for exponential backoff and custom retry logic.
 *
 * @param options - Configuration options for retry behavior.
 * @returns Method decorator that adds retry functionality.
 *
 * @example
 * ```typescript
 * class ApiService {
 *   @Retry({ maxAttempts: 5, delay: 1000, backoff: 2 })
 *   async fetchData(id: string): Promise<Data> {
 *     return await this.http.get(`/api/data/${id}`).toPromise();
 *   }
 *
 *   @Retry({
 *     maxAttempts: 3,
 *     shouldRetry: (error) => error.status === 503
 *   })
 *   async submitForm(data: FormData): Promise<Response> {
 *     return await this.http.post('/api/submit', data).toPromise();
 *   }
 * }
 * ```
 *
 * @public
 */
export function Retry(options?: RetryOptions): MethodDecorator {
  const config: Required<RetryOptions> = {
    maxAttempts: options?.maxAttempts ?? 3,
    delay: options?.delay ?? 1000,
    backoff: options?.backoff ?? 1,
    shouldRetry: options?.shouldRetry ?? (() => true),
    onRetry: options?.onRetry ?? (() => undefined)
  };

  return function (_target: unknown, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let lastError: unknown;
      let currentDelay = config.delay;

      for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt === config.maxAttempts || !config.shouldRetry(error)) {
            throw error;
          }

          config.onRetry(attempt, error);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, currentDelay));

          // Apply exponential backoff
          currentDelay *= config.backoff;
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}
