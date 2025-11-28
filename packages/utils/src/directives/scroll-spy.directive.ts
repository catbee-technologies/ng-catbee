import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  NgModule,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID
} from '@angular/core';
import { fromEvent, Subject, takeUntil, throttleTime } from 'rxjs';

/**
 * Data emitted by the scroll spy directive.
 */
export interface ScrollSpyData {
  /** Current scroll position from top */
  scrollTop: number;
  /** Element's offset from top */
  offsetTop: number;
  /** Whether element is in view */
  isInView: boolean;
}

/**
 * Directive that tracks when an element enters/leaves the viewport on scroll.
 *
 * This directive is useful for navigation highlighting, scroll-based
 * animations, and tracking user reading progress. SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-documentation',
 *   template: `
 *     <nav>
 *       <a [class.active]="section1Active">Section 1</a>
 *       <a [class.active]="section2Active">Section 2</a>
 *     </nav>
 *
 *     <section
 *       scrollSpy
 *       (onScrollSpyChange)="section1Active = $event.isInView"
 *       [scrollSpyOffset]="100">
 *       Section 1 content
 *     </section>
 *
 *     <section
 *       scrollSpy
 *       (onScrollSpyChange)="section2Active = $event.isInView">
 *       Section 2 content
 *     </section>
 *   `,
 *   standalone: true,
 *   imports: [ScrollSpy]
 * })
 * export class DocumentationComponent {
 *   section1Active = false;
 *   section2Active = false;
 * }
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[scrollSpy]',
  standalone: true
})
export class ScrollSpy implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly destroy$ = new Subject<void>();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  /**
   * Offset from top of viewport to trigger active state (default: 0).
   */
  readonly scrollSpyOffset = input<number>(0);

  /**
   * Throttle time for scroll events in milliseconds (default: 100).
   */
  readonly scrollSpyThrottle = input<number>(100);

  /**
   * Event emitted when scroll position changes.
   */
  readonly scrollSpyChange = output<ScrollSpyData>();

  /**
   * Event emitted when element enters viewport.
   */
  readonly enterView = output<void>();

  /**
   * Event emitted when element leaves viewport.
   */
  readonly leaveView = output<void>();

  private wasInView = false;

  ngOnInit(): void {
    // Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Listen to scroll events
    fromEvent(window, 'scroll')
      .pipe(throttleTime(this.scrollSpyThrottle()), takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkVisibility();
      });

    // Initial check
    setTimeout(() => this.checkVisibility(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkVisibility(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || this.document.documentElement.scrollTop;
    const offsetTop = rect.top + scrollTop;

    const viewportHeight = window.innerHeight;
    const elementTop = rect.top;
    const elementBottom = rect.bottom;

    // Check if element is in viewport with offset
    const isInView =
      elementTop - this.scrollSpyOffset() <= viewportHeight && elementBottom - this.scrollSpyOffset() >= 0;

    const data: ScrollSpyData = {
      scrollTop,
      offsetTop,
      isInView
    };

    this.scrollSpyChange.emit(data);

    // Emit enter/leave events
    if (isInView && !this.wasInView) {
      this.enterView.emit();
    } else if (!isInView && this.wasInView) {
      this.leaveView.emit();
    }

    this.wasInView = isInView;
  }
}

@NgModule({
  imports: [ScrollSpy],
  exports: [ScrollSpy]
})
export class ScrollSpyModule {}
