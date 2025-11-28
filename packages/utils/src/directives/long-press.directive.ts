import { Directive, HostListener, input, NgModule, OnDestroy, output } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Directive that emits an event when an element is pressed and held.
 *
 * This directive is useful for mobile interfaces, context menus, and
 * actions that require deliberate user intent.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-context-menu',
 *   template: `
 *     <div
 *       (longPress)="showContextMenu()"
 *       [longPressDuration]="500">
 *       Long press me
 *     </div>
 *   `,
 *   standalone: true,
 *   imports: [LongPress]
 * })
 * export class ContextMenuComponent {
 *   showContextMenu() {
 *     console.log('Context menu opened');
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[longPress]',
  standalone: true
})
export class LongPress implements OnDestroy {
  /**
   * Duration in milliseconds to trigger long press (default: 500).
   */
  readonly longPressDuration = input<number>(500);

  /**
   * Event emitted when long press is triggered.
   */
  readonly longPress = output<MouseEvent | TouchEvent>();

  /**
   * Event emitted when long press is cancelled.
   */
  readonly longPressCancelled = output<void>();

  private timeout: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPressStart(event: MouseEvent | TouchEvent): void {
    this.timeout = setTimeout(() => {
      this.longPress.emit(event);
    }, this.longPressDuration());
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  onPressEnd(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
      this.longPressCancelled.emit();
    }
  }

  ngOnDestroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@NgModule({
  imports: [LongPress],
  exports: [LongPress]
})
export class LongPressModule {}
