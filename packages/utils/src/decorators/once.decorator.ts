/**
 * Ensures a method can only be executed once.
 *
 * This decorator wraps a method so that it can only be called once. Subsequent calls
 * will return the result of the first call without re-executing the method.
 *
 * @returns Method decorator that ensures single execution.
 *
 * @example
 * ```typescript
 * class InitService {
 *   @Once()
 *   initialize(): void {
 *     console.log('Initializing...');
 *     // This will only execute once
 *   }
 *
 *   @Once()
 *   async loadConfig(): Promise<Config> {
 *     return await this.http.get('/config').toPromise();
 *   }
 * }
 * ```
 *
 * @public
 */
export function Once(): MethodDecorator {
  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let hasBeenCalled = false;
    let result: unknown;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      if (!hasBeenCalled) {
        result = originalMethod.apply(this, args);
        hasBeenCalled = true;
      }
      return result;
    };

    return descriptor;
  };
}
