import { Directive, HostListener, input, NgModule, OnDestroy, output } from '@angular/core';

/**
 * Directive that debounces click events to prevent rapid repeated clicks.
 *
 * This is useful for buttons that trigger API calls or expensive operations,
 * preventing duplicate submissions.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-submit-form',
 *   template: `
 *     <button
 *       (debouncedClick)="submit()"
 *       [debounceTime]="500">
 *       Submit
 *     </button>
 *   `,
 *   standalone: true,
 *   imports: [DebounceClick]
 * })
 * export class SubmitFormComponent {
 *   submit() {
 *     console.log('Form submitted');
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[debouncedClick]',
  standalone: true
})
export class DebouncedClick implements OnDestroy {
  /** Input for debounce time in milliseconds (default: 300) */
  readonly debounceTime = input(300);

  /** Output event that emits the click event after the debounce time has passed */
  readonly debouncedClick = output<MouseEvent>();

  /** Input to prevent the default action of the click event (default: false) */
  readonly preventDefault = input(false);

  /** Input to stop propagation of the click event (default: false) */
  readonly stopPropagation = input(false);

  private timeoutId?: ReturnType<typeof setTimeout>;

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.preventDefault()) event.preventDefault();
    if (this.stopPropagation()) event.stopPropagation();

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.debouncedClick.emit(event);
    }, this.debounceTime());
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

@NgModule({
  imports: [DebouncedClick],
  exports: [DebouncedClick]
})
export class DebouncedClickModule {}
