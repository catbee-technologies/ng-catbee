import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  Directive,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  NgModule,
  numberAttribute,
  PLATFORM_ID
} from '@angular/core';

/**
 * Directive that automatically focuses an element when it is initialized.
 * This directive is SSR-safe and can be configured with delay and force options.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-login',
 *   template: `
 *    <input autoFocus [autoFocusDelay]="500" placeholder="Username" />
 *    <input autoFocus [forceAutoFocus]="true" placeholder="Password" />
 *  `,
 *   standalone: true,
 *  imports: [AutoFocus]
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
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly document = inject(DOCUMENT);

  /** Whether to auto-focus the element (default: true). */
  readonly autoFocus = input(true, { transform: booleanAttribute });

  /** Delay in milliseconds before focusing (default: 0). */
  readonly autoFocusDelay = input(0, { transform: numberAttribute });

  /** Whether to force auto-focus even if another element is already focused (default: false). */
  readonly forceAutoFocus = input(false, { transform: booleanAttribute });

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.autoFocus()) return;

    const el = this.elementRef.nativeElement;

    // prevent focus stealing
    if (this.document.activeElement && this.document.activeElement !== this.document.body && !this.forceAutoFocus()) {
      return;
    }

    // prevent focusing hidden elements
    if (!el.offsetParent) return;

    const delay = this.autoFocusDelay();

    if (delay > 0) {
      setTimeout(() => el.focus(), delay);
    } else {
      el.focus();
    }
  }
}

@NgModule({
  imports: [AutoFocus],
  exports: [AutoFocus]
})
export class AutoFocusModule {}
