import { Directive, ElementRef, HostListener, inject, input, NgModule, Renderer2 } from '@angular/core';

/**
 * Type of input mask to apply.
 */
export type InputMaskType = 'phone' | 'creditCard' | 'date' | 'numeric' | 'alphanumeric' | 'custom';

/**
 * Directive that applies input masking to form fields.
 *
 * This directive formats user input in real-time according to specified patterns,
 * useful for phone numbers, credit cards, dates, and custom formats.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-contact-form',
 *   template: `
 *     <input
 *       type="text"
 *       inputMask
 *       [maskType]="'phone'"
 *       placeholder="(555) 123-4567">
 *
 *     <input
 *       type="text"
 *       inputMask
 *       [maskType]="'creditCard'"
 *       placeholder="1234 5678 9012 3456">
 *
 *     <input
 *       type="text"
 *       inputMask
 *       [maskType]="'custom'"
 *       [customMask]="'##/##/####'"
 *       placeholder="MM/DD/YYYY">
 *   `,
 *   standalone: true,
 *   imports: [InputMask]
 * })
 * export class ContactFormComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[inputMask]',
  standalone: true
})
export class InputMask {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Type of mask to apply (default: 'custom').
   */
  readonly maskType = input<InputMaskType>('custom');

  /**
   * Custom mask pattern. Use '#' for digits, 'A' for letters, '*' for alphanumeric.
   * Example: '(###) ###-####' for phone numbers
   */
  readonly customMask = input<string>('');

  /**
   * Whether to allow decimal values for numeric masks (default: false).
   */
  readonly allowDecimal = input<boolean>(false);

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const maskedValue = this.applyMask(value);

    if (value !== maskedValue) {
      this.renderer.setProperty(input, 'value', maskedValue);
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const maskedValue = this.applyMask(pastedText);
    const input = this.elementRef.nativeElement as HTMLInputElement;
    this.renderer.setProperty(input, 'value', maskedValue);
  }

  private applyMask(value: string): string {
    switch (this.maskType()) {
      case 'phone':
        return this.applyPhoneMask(value);
      case 'creditCard':
        return this.applyCreditCardMask(value);
      case 'date':
        return this.applyDateMask(value);
      case 'numeric':
        return this.applyNumericMask(value);
      case 'alphanumeric':
        return this.applyAlphanumericMask(value);
      case 'custom':
        return this.applyCustomMask(value);
      default:
        return value;
    }
  }

  private applyPhoneMask(value: string): string {
    // Format: (123) 456-7890
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  private applyCreditCardMask(value: string): string {
    // Format: 1234 5678 9012 3456
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ').slice(0, 19);
  }

  private applyDateMask(value: string): string {
    // Format: MM/DD/YYYY
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  private applyNumericMask(value: string): string {
    if (this.allowDecimal()) {
      return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    }
    return value.replace(/\D/g, '');
  }

  private applyAlphanumericMask(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  }

  private applyCustomMask(value: string): string {
    if (!this.customMask) return value;

    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    let result = '';
    let cleanedIndex = 0;

    for (let i = 0; i < this.customMask().length && cleanedIndex < cleaned.length; i++) {
      const maskChar = this.customMask()[i];
      const inputChar = cleaned[cleanedIndex];

      if (maskChar === '#') {
        // Digit only
        if (/\d/.test(inputChar)) {
          result += inputChar;
          cleanedIndex++;
        } else {
          break;
        }
      } else if (maskChar === 'A') {
        // Letter only
        if (/[a-zA-Z]/.test(inputChar)) {
          result += inputChar;
          cleanedIndex++;
        } else {
          break;
        }
      } else if (maskChar === '*') {
        // Alphanumeric
        if (/[a-zA-Z0-9]/.test(inputChar)) {
          result += inputChar;
          cleanedIndex++;
        } else {
          break;
        }
      } else {
        // Literal character
        result += maskChar;
      }
    }

    return result;
  }
}

@NgModule({
  imports: [InputMask],
  exports: [InputMask]
})
export class InputMaskModule {}
