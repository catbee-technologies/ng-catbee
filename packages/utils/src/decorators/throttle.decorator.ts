/**
 * Throttles method calls to limit execution frequency.
 *
 * This decorator ensures a method is called at most once per specified time interval,
 * regardless of how many times it's invoked. The first call is executed immediately.
 *
 * @param delay - The throttle delay in milliseconds (default: 300ms).
 * @returns Method decorator that throttles the target method.
 *
 * @example
 * ```typescript
 * class ScrollComponent {
 *   @Throttle(200)
 *   onScroll(event: Event): void {
 *     this.handleScroll(event);
 *   }
 * }
 * ```
 *
 * @public
 */
export function Throttle(delay = 300): MethodDecorator {
  return function (_target: unknown, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastExecuted = 0;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const now = Date.now();

      if (now - lastExecuted >= delay) {
        originalMethod.apply(this, args);
        lastExecuted = now;
      } else if (timeoutId === null) {
        timeoutId = setTimeout(
          () => {
            originalMethod.apply(this, args);
            lastExecuted = Date.now();
            timeoutId = null;
          },
          delay - (now - lastExecuted)
        );
      }
    };

    return descriptor;
  };
}
