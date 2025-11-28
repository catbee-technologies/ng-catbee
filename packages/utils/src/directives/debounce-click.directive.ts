import { Directive, HostListener, input, NgModule, OnDestroy, output } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

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
 *       (debounceClick)="submit()"
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
  selector: '[debounceClick]',
  standalone: true
})
export class DebounceClick implements OnDestroy {
  /**
   * Debounce time in milliseconds (default: 300).
   */
  readonly debounceTime = input<number>(300);

  /**
   * Event emitted after the debounce time has elapsed.
   */
  readonly debounceClick = output<MouseEvent>();

  private readonly clicks$ = new Subject<MouseEvent>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.clicks$
      .pipe(debounceTime(this.debounceTime()), takeUntil(this.destroy$))
      .subscribe(event => this.debounceClick.emit(event));
  }

  @HostListener('click', ['$event'])
  onClickEvent(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks$.next(event);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clicks$.complete();
  }
}

@NgModule({
  imports: [DebounceClick],
  exports: [DebounceClick]
})
export class DebounceClickModule {}
