import { Pipe, PipeTransform } from '@angular/core';

/**
 * Returns a default value if the input is null, undefined, or empty.
 *
 * @example
 * ```html
 * {{ user.name | defaultValue:'Anonymous' }}
 * <!-- Output: 'Anonymous' if name is null/undefined/empty -->
 *
 * {{ user.age | defaultValue:0 }}
 * <!-- Output: 0 if age is null/undefined -->
 *
 * {{ items | defaultValue:[] }}
 * <!-- Output: [] if items is null/undefined -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'defaultValue',
  standalone: true
})
export class DefaultValuePipe implements PipeTransform {
  /**
   * Returns a default value for null/undefined/empty inputs.
   *
   * @param value - The value to check
   * @param defaultValue - The default value to return
   * @param checkEmpty - If true, also treats empty strings/arrays as empty
   * @returns The original value or the default
   */
  transform<T>(value: T | null | undefined, defaultValue: T, checkEmpty = true): T {
    // Check for null/undefined
    if (value == null) {
      return defaultValue;
    }

    // Check for empty strings
    if (checkEmpty && typeof value === 'string' && value.trim() === '') {
      return defaultValue;
    }

    // Check for empty arrays
    if (checkEmpty && Array.isArray(value) && value.length === 0) {
      return defaultValue;
    }

    return value;
  }
}
