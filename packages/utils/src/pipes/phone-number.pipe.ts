import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a phone number string into a readable format.
 *
 * @example
 * ```html
 * {{ '1234567890' | phoneNumber }}
 * <!-- Output: "(123) 456-7890" -->
 *
 * {{ '11234567890' | phoneNumber:'international' }}
 * <!-- Output: "+1 (123) 456-7890" -->
 *
 * {{ '1234567890' | phoneNumber:'dots' }}
 * <!-- Output: "123.456.7890" -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'phoneNumber',
  standalone: true
})
export class PhoneNumberPipe implements PipeTransform {
  /**
   * Formats a phone number.
   *
   * @param value - Phone number string or number
   * @param format - Format style: 'default', 'international', 'dots', 'dashes'
   * @returns Formatted phone number
   */
  transform(
    value: string | number | null | undefined,
    format: 'default' | 'international' | 'dots' | 'dashes' = 'default'
  ): string {
    if (!value) return '';

    // Remove all non-numeric characters
    const cleaned = String(value).replace(/\D/g, '');

    // Handle different lengths
    let countryCode = '';
    let areaCode = '';
    let firstPart = '';
    let secondPart = '';

    if (cleaned.length === 11 && cleaned[0] === '1') {
      // US number with country code
      countryCode = '1';
      areaCode = cleaned.substring(1, 4);
      firstPart = cleaned.substring(4, 7);
      secondPart = cleaned.substring(7, 11);
    } else if (cleaned.length === 10) {
      // US number without country code
      areaCode = cleaned.substring(0, 3);
      firstPart = cleaned.substring(3, 6);
      secondPart = cleaned.substring(6, 10);
    } else {
      // Return original if format not recognized
      return cleaned;
    }

    switch (format) {
      case 'international':
        return countryCode
          ? `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`
          : `(${areaCode}) ${firstPart}-${secondPart}`;
      case 'dots':
        return `${areaCode}.${firstPart}.${secondPart}`;
      case 'dashes':
        return `${areaCode}-${firstPart}-${secondPart}`;
      case 'default':
      default:
        return `(${areaCode}) ${firstPart}-${secondPart}`;
    }
  }
}
