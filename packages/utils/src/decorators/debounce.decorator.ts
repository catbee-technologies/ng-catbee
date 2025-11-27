/**
 * Debounces method calls to prevent excessive execution.
 *
 * This decorator delays the execution of a method until after a specified time has elapsed
 * since the last time it was invoked. Useful for handling rapid user inputs or events.
 *
 * @param delay - The debounce delay in milliseconds (default: 300ms).
 * @returns Method decorator that debounces the target method.
 *
 * @example
 * ```typescript
 * class SearchComponent {
 *   @Debounce(500)
 *   onSearchInput(term: string): void {
 *     this.search(term);
 *   }
 * }
 * ```
 *
 * @public
 */
export function Debounce(delay = 300): MethodDecorator {
  return function (_target: unknown, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
        timeoutId = null;
      }, delay);
    };

    return descriptor;
  };
}
