import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, input, NgModule, OnDestroy, OnInit, output, PLATFORM_ID } from '@angular/core';

/**
 * Data emitted by the intersection observer directive.
 */
export interface IntersectionData {
  /** Whether the element is intersecting */
  isIntersecting: boolean;
  /** The intersection ratio (0-1) */
  intersectionRatio: number;
  /** The raw IntersectionObserverEntry */
  entry: IntersectionObserverEntry;
}

/**
 * Directive that observes element visibility using Intersection Observer API.
 *
 * This directive is useful for infinite scrolling, animations on scroll,
 * lazy loading, and tracking element visibility. SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-infinite-scroll',
 *   template: `
 *     <div *ngFor="let item of items">{{ item }}</div>
 *     <div
 *       intersectionObserver
 *       (intersection)="loadMore($event)"
 *       [ioThreshold]="0.5">
 *       Loading...
 *     </div>
 *   `,
 *   standalone: true,
 *   imports: [IntersectionObserverDirective]
 * })
 * export class InfiniteScrollComponent {
 *   items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
 *
 *   loadMore(data: IntersectionData) {
 *     if (data.isIntersecting) {
 *       const start = this.items.length;
 *       const newItems = Array.from({ length: 20 }, (_, i) => `Item ${start + i + 1}`);
 *       this.items.push(...newItems);
 *     }
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[intersectionObserver]',
  standalone: true
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  /**
   * Intersection threshold (0-1). Can be a single value or array of values.
   * Default: 0
   */
  readonly ioThreshold = input<number | number[]>(0);

  /**
   * Root margin for the observer (e.g., '50px', '10%').
   * Default: '0px'
   */
  readonly ioRootMargin = input<string>('0px');

  /**
   * Root element for intersection checking. Defaults to viewport.
   */
  readonly ioRoot = input<Element | null>(null);

  /**
   * Event emitted when intersection changes.
   */
  readonly intersection = output<IntersectionData>();

  /**
   * Event emitted when element enters viewport.
   */
  readonly enter = output<IntersectionData>();

  /**
   * Event emitted when element leaves viewport.
   */
  readonly leave = output<IntersectionData>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver is not supported in this browser');
      return;
    }

    this.createObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private createObserver(): void {
    const options: IntersectionObserverInit = {
      root: this.ioRoot(),
      rootMargin: this.ioRootMargin(),
      threshold: this.ioThreshold()
    };

    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const data: IntersectionData = {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          entry
        };

        this.intersection.emit(data);

        if (entry.isIntersecting) {
          this.enter.emit(data);
        } else {
          this.leave.emit(data);
        }
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);
  }
}

@NgModule({
  imports: [IntersectionObserverDirective],
  exports: [IntersectionObserverDirective]
})
export class IntersectionObserverModule {}
