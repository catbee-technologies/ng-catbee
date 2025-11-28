import { Directive, ElementRef, inject, input, NgModule, OnDestroy, OnInit, output } from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';

/**
 * Directive that emits an event when a click occurs outside the host element.
 *
 * This is particularly useful for dropdowns, modals, and context menus that
 * need to close when clicking outside.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-dropdown',
 *   template: `
 *     <div
 *       (clickOutside)="close()"
 *       [excludeSelectors]="['.modal-backdrop', '#ignore-me']">
 *       <button (click)="toggle()">Toggle</button>
 *       <ul *ngIf="isOpen">
 *         <li>Item 1</li>
 *         <li>Item 2</li>
 *       </ul>
 *     </div>
 *
 *     <!-- Exclude by element reference -->
 *     <div
 *       (clickOutside)="close()"
 *       [excludeElements]="[triggerButton]">
 *       <ul *ngIf="isOpen">...</ul>
 *     </div>
 *     <button #triggerButton (click)="toggle()">Toggle</button>
 *   `,
 *   standalone: true,
 *   imports: [ClickOutside]
 * })
 * export class DropdownComponent {
 *   isOpen = false;
 *   toggle() { this.isOpen = !this.isOpen; }
 *   close() { this.isOpen = false; }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutside implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();

  /**
   * CSS selectors for elements to exclude from click-outside detection.
   * Accepts IDs (#id), classes (.class), or any valid CSS selector.
   */
  readonly excludeSelectors = input<string[]>([]);

  /**
   * Element references to exclude from click-outside detection.
   */
  readonly excludeElements = input<HTMLElement[]>([]);

  /**
   * Event emitted when a click occurs outside the host element.
   */
  readonly clickOutside = output<MouseEvent>();

  ngOnInit(): void {
    fromEvent<MouseEvent>(document, 'click')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        const target = event.target as HTMLElement;

        // Check if clicked inside host element
        const clickedInside = this.elementRef.nativeElement.contains(target);
        if (clickedInside) {
          return;
        }

        // Check if clicked on excluded selectors
        const excludedBySelector = this.excludeSelectors().some(selector => {
          try {
            return target.closest(selector) !== null;
          } catch {
            // Invalid selector, skip
            return false;
          }
        });

        if (excludedBySelector) {
          return;
        }

        // Check if clicked on excluded elements
        const excludedByElement = this.excludeElements().some(element => {
          return element?.contains(target);
        });

        if (excludedByElement) {
          return;
        }

        // Click was outside and not excluded
        this.clickOutside.emit(event);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@NgModule({
  imports: [ClickOutside],
  exports: [ClickOutside]
})
export class ClickOutsideModule {}
