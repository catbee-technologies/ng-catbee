/**
 * Binds a method to its class instance context.
 *
 * This decorator automatically binds the method to the instance, preserving the correct
 * 'this' context when the method is passed as a callback or event handler.
 *
 * @returns Method decorator that binds the method to its instance.
 *
 * @example
 * ```typescript
 * class EventComponent {
 *   private count = 0;
 *
 *   @Bind()
 *   handleClick(): void {
 *     this.count++; // 'this' is always the component instance
 *     console.log(this.count);
 *   }
 *
 *   ngOnInit(): void {
 *     // Safe to pass as callback without losing context
 *     button.addEventListener('click', this.handleClick);
 *   }
 * }
 * ```
 *
 * @public
 */
export function Bind(): MethodDecorator {
  return function (_target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    return {
      configurable: true,
      get(this: unknown) {
        const boundMethod = originalMethod.bind(this);
        Object.defineProperty(this, propertyKey, {
          value: boundMethod,
          configurable: true,
          writable: true
        });
        return boundMethod;
      }
    } as PropertyDescriptor;
  };
}
