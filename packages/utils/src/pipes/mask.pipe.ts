import { Pipe, PipeTransform } from '@angular/core';

/**
 * Masks sensitive information with a specified character.
 *
 * @example
 * ```html
 * {{ '1234567890' | mask }}
 * <!-- Output: "******7890" (shows last 4 digits) -->
 *
 * {{ '1234567890' | mask:6 }}
 * <!-- Output: "****567890" (shows last 6 digits) -->
 *
 * {{ 'secret' | mask:0:'#' }}
 * <!-- Output: "######" (masks all with #) -->
 *
 * {{ 'email@example.com' | mask:4:'*':true }}
 * <!-- Output: "emai**********" (shows first 4) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'mask',
  standalone: true
})
export class MaskPipe implements PipeTransform {
  /**
   * Masks a string with a specified character.
   *
   * @param value - String to mask
   * @param visibleDigits - Number of digits to show (default: 4)
   * @param maskChar - Character to use for masking (default: '*')
   * @param showStart - If true, shows first N digits instead of last N
   * @returns Masked string
   */
  transform(value: string | number | null | undefined, visibleDigits = 4, maskChar = '*', showStart = false): string {
    if (!value) return '';

    const str = String(value);
    const maskLength = Math.max(0, str.length - visibleDigits);

    if (maskLength <= 0) {
      return str;
    }

    const mask = maskChar.repeat(maskLength);

    if (showStart) {
      return str.substring(0, visibleDigits) + mask;
    }

    return mask + str.substring(maskLength);
  }
}
