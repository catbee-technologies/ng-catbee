import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';
import {
  booleanAttribute,
  Directive,
  effect,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  inject,
  input,
  NgModule,
  Output,
  PLATFORM_ID,
  Provider
} from '@angular/core';
import { PlatformService } from '@ng-catbee/utils/platform';

/**
 * Supported key filter pattern types
 */
export type KeyFilterPattern = 'pint' | 'int' | 'pnum' | 'money' | 'num' | 'hex' | 'email' | 'alpha' | 'alphanum';

/**
 * Special key codes for keyboard navigation
 */
const SPECIAL_KEYS = {
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  BACKSPACE: 8,
  DELETE: 46
} as const;

/**
 * Safari browser specific key mappings
 */
const SAFARI_KEY_MAP: Record<number, number> = {
  63234: 37, // left arrow
  63235: 39, // right arrow
  63232: 38, // up arrow
  63233: 40, // down arrow
  63276: 33, // page up
  63277: 34, // page down
  63272: 46, // delete
  63273: 36, // home
  63275: 35 // end
};

/**
 * Predefined regex patterns for common input validations
 */
const PATTERN_MASKS: Record<KeyFilterPattern, RegExp> = {
  pint: /^[\d]*$/,
  int: /^[-]?[\d]*$/,
  pnum: /^[\d.]*$/,
  money: /^[\d.\s,]*$/,
  num: /^[-]?[\d.]*$/,
  hex: /^[0-9a-f]*$/i,
  email: /^[a-z0-9_.\-@]*$/i,
  alpha: /^[a-z_]*$/i,
  alphanum: /^[a-z0-9_]*$/i
};

/**
 * Validator provider for KeyFilter directive
 */
export const KEYFILTER_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => KeyFilter),
  multi: true
};
/**
 * KeyFilter Directive restricts user input based on regular expressions.
 * Supports both pattern-based blocking and validation-only modes.
 * @group Components
 */
@Directive({
  selector: '[keyFilter]',
  standalone: true,
  providers: [KEYFILTER_VALIDATOR]
})
export class KeyFilter implements Validator {
  // Dependency Injection
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly platformService = inject(PlatformService);
  public readonly el = inject(ElementRef);

  // Input Properties
  /**
   * When enabled, input is validated rather than blocking keys
   * @group Props
   */
  readonly validateOnly = input(false, { transform: booleanAttribute });

  /**
   * Pattern for key filtering - can be a RegExp or predefined pattern name
   * @group Props
   */
  readonly pattern = input<RegExp | KeyFilterPattern | null | undefined>(undefined, {
    alias: 'keyFilter'
  });

  // Output Events
  /**
   * Emits when the ngModel value changes
   * @param {(string | number)} modelValue - Updated model value
   * @group Emits
   */
  @Output() ngModelChange: EventEmitter<string | number> = new EventEmitter<string | number>();

  // Internal State
  regex: RegExp = /./;
  _pattern: RegExp | KeyFilterPattern | null | undefined;
  isAndroid: boolean;
  lastValue: string | undefined;

  constructor() {
    this.isAndroid = isPlatformBrowser(this.platformId) ? this.platformService.isAndroid : false;

    // React to pattern changes
    effect(() => {
      const _pattern = this.pattern();
      this._pattern = _pattern;

      if (_pattern instanceof RegExp) {
        this.regex = _pattern;
      } else if (_pattern && _pattern in PATTERN_MASKS) {
        this.regex = PATTERN_MASKS[_pattern as keyof typeof PATTERN_MASKS];
      } else {
        this.regex = /./;
      }
    });
  }

  // Validation Methods
  /**
   * Form validator implementation
   */
  validate(_c: AbstractControl): Record<string, boolean> | null {
    if (this.validateOnly()) {
      const value = this.el.nativeElement.value;
      if (value && !this.regex.test(value)) {
        return {
          validatePattern: false
        };
      }
    }
    return null;
  }

  /**
   * Validates a single character against the regex
   */
  private isValidChar(c: string): boolean {
    return this.regex.test(c);
  }

  /**
   * Validates an entire string against the regex
   */
  private isValidString(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (!this.isValidChar(str.substr(i, 1))) {
        return false;
      }
    }
    return true;
  }

  // Keyboard Event Utilities
  /**
   * Checks if the key is a navigation key
   */
  private isNavKeyPress(e: KeyboardEvent): boolean {
    let k = e.keyCode;
    k = this.platformService.getBrowser()['safari'] ? SAFARI_KEY_MAP[k] || k : k;

    return (k >= 33 && k <= 40) || k == SPECIAL_KEYS.RETURN || k == SPECIAL_KEYS.TAB || k == SPECIAL_KEYS.ESC;
  }

  /**
   * Checks if the key is a special control key
   */
  private isSpecialKey(e: KeyboardEvent): boolean {
    const k = e.keyCode || e.charCode;
    return (
      k == 9 ||
      k == 13 ||
      k == 27 ||
      k == 16 ||
      k == 17 ||
      (k >= 18 && k <= 20) ||
      (!!this.platformService.getBrowser()['opera'] &&
        !e.shiftKey &&
        (k == 8 || (k >= 33 && k <= 35) || (k >= 36 && k <= 39) || (k >= 44 && k <= 45)))
    );
  }

  /**
   * Gets the normalized key code (handles Safari differences)
   */
  private getKey(e: KeyboardEvent): number {
    const k = e.keyCode || e.charCode;
    return this.platformService.getBrowser()['safari'] ? SAFARI_KEY_MAP[k] || k : k;
  }

  /**
   * Gets the character code from keyboard event
   */
  private getCharCode(e: KeyboardEvent): number {
    return e.charCode || e.keyCode || e.which;
  }

  // String Manipulation Utilities
  /**
   * Finds the difference between two strings
   */
  private findDelta(value: string, prevValue: string): string {
    let delta = '';

    for (let i = 0; i < value.length; i++) {
      const str = value.substr(0, i) + value.substr(i + value.length - prevValue.length);

      if (str === prevValue) delta = value.substr(i, value.length - prevValue.length);
    }

    return delta;
  }

  // Event Handlers

  // Event Handlers
  /**
   * Handles input events for Android devices
   */
  @HostListener('input')
  onInput(): void {
    if (this.isAndroid && !this.validateOnly()) {
      let val = this.el.nativeElement.value;
      const lastVal = this.lastValue || '';

      const inserted = this.findDelta(val, lastVal);
      const removed = this.findDelta(lastVal, val);
      const pasted = inserted.length > 1 || (!inserted && !removed);

      if (pasted) {
        if (!this.isValidString(val)) {
          this.el.nativeElement.value = lastVal;
          this.ngModelChange.emit(lastVal);
        }
      } else if (!removed) {
        if (!this.isValidChar(inserted)) {
          this.el.nativeElement.value = lastVal;
          this.ngModelChange.emit(lastVal);
        }
      }

      val = this.el.nativeElement.value;
      if (this.isValidString(val)) {
        this.lastValue = val;
      }
    }
  }

  /**
   * Handles keypress events to filter input
   */
  @HostListener('keypress', ['$event'])
  onKeyPress(e: KeyboardEvent): void {
    if (this.isAndroid || this.validateOnly()) {
      return;
    }

    const browser = this.platformService.getBrowser();
    const k = this.getKey(e);

    if (browser['mozilla'] && (e.ctrlKey || e.altKey)) {
      return;
    } else if (k == 17 || k == 18) {
      return;
    }

    // Allow Enter key
    if (k == 13) {
      return;
    }

    const c = this.getCharCode(e);
    const cc = String.fromCharCode(c);
    let ok = true;

    if (!browser['mozilla'] && (this.isSpecialKey(e) || !cc)) {
      return;
    }

    const existingValue = this.el.nativeElement.value || '';
    const combinedValue = existingValue + cc;

    ok = this.regex.test(combinedValue);

    if (!ok) {
      e.preventDefault();
    }
  }

  /**
   * Handles paste events to validate pasted content
   */
  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent): void {
    let clipboardData = e.clipboardData;

    // Fallback for older browsers
    if (!clipboardData && this.document.defaultView) {
      const windowClipboard = (
        this.document.defaultView as Window & { clipboardData?: { getData: (format: string) => string } }
      ).clipboardData;
      if (windowClipboard) {
        clipboardData = {
          getData: (_format: string) => windowClipboard.getData('text')
        } as DataTransfer;
      }
    }

    if (clipboardData) {
      const pattern = /\{[0-9]+\}/;
      const pastedText = clipboardData.getData('text');
      if (pattern.test(this.regex.toString())) {
        if (!this.regex.test(pastedText)) {
          e.preventDefault();
          return;
        }
      } else {
        for (const char of pastedText.toString()) {
          if (!this.regex.test(char)) {
            e.preventDefault();
            return;
          }
        }
      }
    }
  }
}

@NgModule({
  imports: [KeyFilter],
  exports: [KeyFilter]
})
export class KeyFilterModule {}
