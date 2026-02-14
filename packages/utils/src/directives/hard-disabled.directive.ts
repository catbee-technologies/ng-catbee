import {
  DestroyRef,
  Directive,
  ElementRef,
  NgModule,
  Renderer2,
  Signal,
  booleanAttribute,
  effect,
  inject,
  input
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
import { Injector, OnInit } from '@angular/core';
import { distinctUntilChanged, map, startWith } from 'rxjs';

/**
 * Directive that enforces a "hard disabled" state on an element, preventing all user interactions.
 * The directive listens to both a manual `hardDisabled` input and the disabled state of any associated form control.
 *
 * When active, it prevents clicks, keyboard events, pasting, dropping, and focuses on the element. It also adds appropriate ARIA attributes and CSS classes for styling.
 *
 * @example
 * To use on a button:
 * ```html
 * <button [hardDisabled]="isButtonDisabled" disableClass="custom-disabled">Click Me</button>
 * ```
 *
 * @example
 * To use in a form control:
 * Make the hardDisabled state to false to allow form control to manage the disabled state, or true to force disable regardless of form control state.
 * ```html
 * <input type="text" [formControl]="myControl" [hardDisabled]="false">
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[hardDisabled]',
  standalone: true
})
export class HardDisabled implements OnInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly nativeEl = this.el.nativeElement;
  private readonly ngControl = inject(NgControl, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** Input to force the disabled state (default: false) */
  readonly hardDisabled = input(false, { transform: booleanAttribute });
  /** Input for custom CSS class to apply when disabled (default: 'catbee-hard-disabled') */
  readonly disableClass = input('catbee-hard-disabled');

  // eslint-disable-next-line
  private controlStatus?: Signal<boolean>;
  private isDisabled: boolean = false;

  constructor() {
    effect(() => {
      const forced = this.hardDisabled();
      const controlDisabled = this.controlStatus?.() ?? false;
      this.isDisabled = forced || controlDisabled;
      this.updateDisabledState(this.isDisabled);
    });

    const commonHandler = (e: Event) => {
      if (!this.isDisabled) return;
      e.stopImmediatePropagation();
      e.preventDefault();
    };

    const focusHandler = (e: Event) => {
      if (!this.isDisabled) return;
      e.preventDefault();
      this.nativeEl.blur();
    };

    /**
     * Event blocking strategy:
     *
     * We intentionally do NOT use @HostListener here.
     *
     * Angular HostListener attaches handlers during the bubbling phase of the DOM event lifecycle.
     * By the time a bubbling listener runs, other handlers (including component click bindings)
     * may have already executed depending on listener registration order.
     *
     * To guarantee that no consumer handler fires when the element is "hard disabled",
     * we register native event listeners in the CAPTURE phase instead.
     *
     * Capture phase order:
     *   CAPTURE -> TARGET -> BUBBLE
     *
     * Blocking the event during capture ensures it never reaches the target or bubble
     * listeners, providing a stronger and more predictable interaction lock.
     */
    for (const event of ['click', 'keydown', 'paste', 'drop']) {
      this.nativeEl.addEventListener(event, commonHandler, { capture: true });
      this.destroyRef.onDestroy(() => {
        this.nativeEl.removeEventListener(event, commonHandler, { capture: true });
      });
    }
    this.nativeEl.addEventListener('focus', focusHandler, { capture: true });
    this.destroyRef.onDestroy(() => {
      this.nativeEl.removeEventListener('focus', focusHandler, { capture: true });
    });
  }

  ngOnInit() {
    const control = this.ngControl?.control;
    if (control) {
      this.controlStatus = toSignal(
        control.events.pipe(
          map(() => control.status === 'DISABLED'),
          startWith(control.status === 'DISABLED'),
          distinctUntilChanged()
        ),
        { injector: this.injector, requireSync: true }
      );
    }
  }

  private previousTabIndex: string | null = null;
  private updateDisabledState(disabled: boolean) {
    const disableClass = this.disableClass();
    if (disabled) {
      this.renderer.setAttribute(this.nativeEl, 'aria-disabled', 'true');
      this.renderer.addClass(this.nativeEl, disableClass);
      if (this.previousTabIndex === null) {
        this.previousTabIndex = this.nativeEl.getAttribute('tabindex');
      }
      this.renderer.setAttribute(this.nativeEl, 'tabindex', '-1');
      if ('disabled' in this.nativeEl) {
        this.renderer.setProperty(this.nativeEl, 'disabled', true);
      }
    } else {
      this.renderer.removeAttribute(this.nativeEl, 'aria-disabled');
      this.renderer.removeClass(this.nativeEl, disableClass);
      if (this.previousTabIndex !== null) {
        this.renderer.setAttribute(this.nativeEl, 'tabindex', this.previousTabIndex);
      } else {
        this.renderer.removeAttribute(this.nativeEl, 'tabindex');
      }
      if ('disabled' in this.nativeEl) {
        this.renderer.setProperty(this.nativeEl, 'disabled', false);
      }
    }
  }
}

@NgModule({
  imports: [HardDisabled],
  exports: [HardDisabled]
})
export class HardDisabledModule {}
