/**
 * Configuration options for the Deprecated decorator.
 */
export interface DeprecatedOptions {
  /** Alternative method or class to use instead */
  alternative?: string;
  /** Version when the feature will be removed */
  removeInVersion?: string;
  /** Custom deprecation message */
  message?: string;
  /** Whether to throw an error instead of warning (default: false) */
  throwError?: boolean;
}

/**
 * Marks a method or class as deprecated with a warning message.
 *
 * This decorator logs a deprecation warning when a deprecated method is called
 * or when a deprecated class is instantiated.
 *
 * @param options - Configuration options for the deprecation notice.
 * @returns Method or class decorator that marks the target as deprecated.
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Deprecated({ alternative: 'fetchUserById', removeInVersion: 'v3.0.0' })
 *   getUser(id: string): User {
 *     return this.fetchUserById(id);
 *   }
 *
 *   @Deprecated({ message: 'Use UserService v2 instead' })
 *   legacyMethod(): void {
 *     // deprecated implementation
 *   }
 * }
 * ```
 *
 * @public
 */
export function Deprecated(options?: DeprecatedOptions): MethodDecorator & ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor): any {
    // Method decorator
    if (descriptor && propertyKey) {
      const originalMethod = descriptor.value;
      const methodName = String(propertyKey);

      descriptor.value = function (this: unknown, ...args: unknown[]) {
        const warning = buildWarningMessage(
          `Method '${methodName}'`,
          options?.alternative,
          options?.removeInVersion,
          options?.message
        );

        if (options?.throwError) {
          throw new Error(warning);
        } else {
          console.warn(warning);
        }

        return originalMethod.apply(this, args);
      };

      return descriptor;
    }

    // Class decorator
    if (typeof target === 'function') {
      const originalConstructor = target;
      const className = originalConstructor.name;

      const newConstructor = function (...args: unknown[]) {
        const warning = buildWarningMessage(
          `Class '${className}'`,
          options?.alternative,
          options?.removeInVersion,
          options?.message
        );

        if (options?.throwError) {
          throw new Error(warning);
        } else {
          console.warn(warning);
        }

        return new originalConstructor(...args);
      };

      // Preserve prototype chain
      newConstructor.prototype = originalConstructor.prototype;
      Object.setPrototypeOf(newConstructor, originalConstructor);

      return newConstructor;
    }
  };
}

/**
 * Builds a deprecation warning message.
 */
function buildWarningMessage(
  target: string,
  alternative?: string,
  removeInVersion?: string,
  customMessage?: string
): string {
  if (customMessage) {
    return `⚠️ DEPRECATED: ${customMessage}`;
  }

  let message = `⚠️ DEPRECATED: ${target} is deprecated`;

  if (removeInVersion) {
    message += ` and will be removed in ${removeInVersion}`;
  }

  if (alternative) {
    message += `. Use '${alternative}' instead`;
  }

  message += '.';

  return message;
}
