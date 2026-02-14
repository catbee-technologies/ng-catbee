import { DestroyRef, Directive, ElementRef, inject, input, NgModule, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent } from 'rxjs';
import { NgZone } from '@angular/core';
import { DOCUMENT } from '@angular/common';

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
 *       @if(isOpen) {
 *        <ul>
 *          <li>Item 1</li>
 *          <li>Item 2</li>
 *        </ul>
 *       }
 *     </div>
 *
 *     <!-- Exclude by element reference -->
 *     <div
 *       (clickOutside)="close()"
 *       [excludeElements]="[triggerButton]">
 *       @if(isOpen) {
 *        <ul>...</ul>
 *       }
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
export class ClickOutside implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  /**
   * CSS selectors for elements to exclude from click-outside detection.
   * Accepts IDs (#id), classes (.class), or any valid CSS selector.
   */
  readonly excludeSelectors = input<string[]>([]);

  /** Element references to exclude from click-outside detection. */
  readonly excludeElements = input<HTMLElement[]>([]);

  /** Event emitted when a click occurs outside the host element. */
  readonly clickOutside = output<PointerEvent>();

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      fromEvent<PointerEvent>(this.document, 'pointerdown')
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(event => event.button === 0)
        ) // Only left-clicks
        .subscribe(event => {
          const target = event.target as HTMLElement;

          // Check if clicked inside host element
          const path = event.composedPath();
          const clickedInside = path.includes(this.elementRef.nativeElement);
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
          this.zone.run(() => {
            this.clickOutside.emit(event);
          });
        });
    });
  }
}

@NgModule({
  imports: [ClickOutside],
  exports: [ClickOutside]
})
export class ClickOutsideModule {}
