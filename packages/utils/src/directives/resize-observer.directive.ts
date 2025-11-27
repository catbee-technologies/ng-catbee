import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, input, NgModule, OnDestroy, OnInit, output, PLATFORM_ID } from '@angular/core';

/**
 * Data emitted by the resize observer directive.
 */
export interface ResizeData {
  /** The current width of the element */
  width: number;
  /** The current height of the element */
  height: number;
  /** The raw ResizeObserverEntry */
  entry: ResizeObserverEntry;
}

/**
 * Directive that observes element size changes using ResizeObserver API.
 *
 * This directive is useful for responsive components, charts that need to
 * redraw on size change, and dynamic layouts. SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-responsive-chart',
 *   template: `
 *     <div
 *       resizeObserver
 *       (sizeChanged)="updateChart($event)"
 *       [resizeDebounce]="100">
 *       <canvas #chart></canvas>
 *     </div>
 *   `,
 *   standalone: true,
 *   imports: [ResizeObserverDirective]
 * })
 * export class ResponsiveChartComponent {
 *   updateChart(data: ResizeData) {
 *     console.log(`New size: ${data.width}x${data.height}`);
 *     // Redraw chart with new dimensions
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[resizeObserver]',
  standalone: true
})
export class ResizeObserverDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: ResizeObserver | null = null;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Debounce time in milliseconds to throttle resize events (default: 0).
   */
  readonly resizeDebounce = input<number>(0);

  /**
   * Event emitted when element is resized.
   */
  readonly sizeChanged = output<ResizeData>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if ResizeObserver is supported
    if (!('ResizeObserver' in window)) {
      console.warn('ResizeObserver is not supported in this browser');
      return;
    }

    this.createObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  private createObserver(): void {
    this.observer = new ResizeObserver(entries => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(() => {
        entries.forEach(entry => {
          const { width, height } = entry.contentRect;
          const data: ResizeData = {
            width,
            height,
            entry
          };
          this.sizeChanged.emit(data);
        });
      }, this.resizeDebounce());
    });

    this.observer.observe(this.elementRef.nativeElement);
  }
}

@NgModule({
  imports: [ResizeObserverDirective],
  exports: [ResizeObserverDirective]
})
export class ResizeObserverModule {}
