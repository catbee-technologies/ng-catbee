/**
 * Configuration options for the Log decorator.
 */
export interface LogOptions {
  /** Whether to log method arguments (default: true) */
  logArgs?: boolean;
  /** Whether to log the return value (default: true) */
  logResult?: boolean;
  /** Whether to log execution time (default: false) */
  logTime?: boolean;
  /** Custom prefix for log messages */
  prefix?: string;
  /** Log level: 'log', 'debug', 'info', 'warn', 'error' (default: 'log') */
  level?: 'log' | 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Logs method calls with arguments, results, and execution time.
 *
 * This decorator automatically logs method invocations for debugging purposes.
 * Useful during development to track method calls and performance.
 *
 * @param options - Configuration options for logging behavior.
 * @returns Method decorator that logs method execution.
 *
 * @example
 * ```typescript
 * class DataService {
 *   @Log()
 *   fetchUser(id: string): User {
 *     return this.http.get(`/users/${id}`);
 *   }
 *
 *   @Log({ logTime: true, level: 'debug' })
 *   processData(data: Data[]): ProcessedData {
 *     return this.transform(data);
 *   }
 * }
 * ```
 *
 * @public
 */
export function Log(options?: LogOptions): MethodDecorator {
  const config: Required<LogOptions> = {
    logArgs: options?.logArgs ?? true,
    logResult: options?.logResult ?? true,
    logTime: options?.logTime ?? false,
    prefix: options?.prefix ?? '',
    level: options?.level ?? 'log'
  };

  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const className = (target as { constructor: { name: string } }).constructor.name;
      const fullMethodName = `${className}.${methodName}`;
      const logPrefix = config.prefix ? `[${config.prefix}] ` : '';

      const startTime = config.logTime ? performance.now() : 0;

      // Log method call
      if (config.logArgs) {
        console[config.level](`${logPrefix}${fullMethodName} called with:`, args);
      } else {
        console[config.level](`${logPrefix}${fullMethodName} called`);
      }

      // Execute the original method
      const result = originalMethod.apply(this, args);

      // Log result
      if (config.logResult) {
        console[config.level](`${logPrefix}${fullMethodName} returned:`, result);
      }

      // Log execution time
      if (config.logTime) {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console[config.level](`${logPrefix}${fullMethodName} execution time: ${duration}ms`);
      }

      return result;
    };

    return descriptor;
  };
}
