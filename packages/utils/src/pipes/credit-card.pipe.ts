import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats and masks a credit card number.
 *
 * @example
 * ```html
 * {{ '4532123456789012' | creditCard }}
 * <!-- Output: "**** **** **** 9012" -->
 *
 * {{ '4532123456789012' | creditCard:false }}
 * <!-- Output: "4532 1234 5678 9012" (unmasked) -->
 *
 * {{ '4532123456789012' | creditCard:true:6 }}
 * <!-- Output: "**** **** **89 9012" (show last 6) -->
 * ```
 *
 * @publicApi
 */
@Pipe({
  name: 'creditCard',
  standalone: true
})
export class CreditCardPipe implements PipeTransform {
  /**
   * Formats and optionally masks a credit card number.
   *
   * @param value - Credit card number
   * @param masked - Whether to mask the number (default: true)
   * @param visibleDigits - Number of digits to show when masked (default: 4)
   * @returns Formatted credit card number
   */
  transform(value: string | number | null | undefined, masked = true, visibleDigits = 4): string {
    if (!value) return '';

    // Remove all non-numeric characters
    const cleaned = String(value).replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
      return value.toString(); // Invalid length for a credit card
    }

    // Split into groups of 4
    const groups: string[] = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }

    if (masked) {
      // Calculate how many groups to mask
      const totalDigits = cleaned.length;
      const maskDigits = totalDigits - visibleDigits;

      let remaining = maskDigits;
      const maskedGroups = groups.map(group => {
        if (remaining <= 0) {
          return group;
        }

        const maskCount = Math.min(remaining, group.length);
        remaining -= maskCount;
        return '*'.repeat(maskCount) + group.substring(maskCount);
      });

      return maskedGroups.join(' ');
    }

    return groups.join(' ');
  }
}
