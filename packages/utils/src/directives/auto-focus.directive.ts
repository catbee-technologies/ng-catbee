import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, inject, input, NgModule, PLATFORM_ID } from '@angular/core';

/**
 * Directive that automatically focuses an element when it appears in the DOM.
 *
 * This directive is SSR-safe and only focuses elements in browser context.
 * Supports delayed focus for elements that need time to render.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-login',
 *   template: `
 *     <input type="text" autoFocus placeholder="Username">
 *     <input type="password" [autoFocus]="true" [autoFocusDelay]="100" placeholder="Password">
 *   `,
 *   standalone: true,
 *   imports: [AutoFocus]
 * })
 * export class LoginComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[autoFocus]',
  standalone: true
})
export class AutoFocus implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);

  /**
   * Whether to auto-focus the element (default: true).
   */
  readonly autoFocus = input<boolean | string>(true);

  /**
   * Delay in milliseconds before focusing (default: 0).
   */
  readonly autoFocusDelay = input<number>(0);

  ngAfterViewInit(): void {
    // Only focus in browser context
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if auto-focus is enabled
    const shouldFocus = this.autoFocus() === '' || this.autoFocus() === true || this.autoFocus() === 'true';
    if (!shouldFocus) {
      return;
    }

    // Focus with optional delay
    setTimeout(() => {
      this.elementRef.nativeElement?.focus();
    }, this.autoFocusDelay());
  }
}

@NgModule({
  imports: [AutoFocus],
  exports: [AutoFocus]
})
export class AutoFocusModule {}
