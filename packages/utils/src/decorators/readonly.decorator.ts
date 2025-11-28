/**
 * Makes a class property read-only after initialization.
 *
 * This decorator prevents modification of a property after it has been set,
 * throwing an error if an attempt is made to reassign it.
 *
 * @returns Property decorator that makes the property read-only.
 *
 * @example
 * ```typescript
 * class ConfigService {
 *   @ReadOnly()
 *   apiUrl = 'https://api.example.com';
 *
 *   @ReadOnly()
 *   maxRetries = 3;
 * }
 *
 * const config = new ConfigService();
 * config.apiUrl = 'https://new-url.com'; // Throws error
 * ```
 *
 * @public
 */
export function ReadOnly(): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    const privateKey = Symbol(`__readonly_${String(propertyKey)}`);

    Object.defineProperty(target, propertyKey, {
      get(this: Record<string | symbol, unknown>) {
        return this[privateKey];
      },
      set(this: Record<string | symbol, unknown>, value: unknown) {
        if (this[privateKey] !== undefined) {
          throw new Error(`Property '${String(propertyKey)}' is read-only and cannot be modified.`);
        }
        this[privateKey] = value;
      },
      enumerable: true,
      configurable: true
    });
  };
}
