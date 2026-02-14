import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  NgModule,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  inject
} from '@angular/core';

/**
 * Directive that hides an element when the user scrolls down and shows it when scrolling up.
 *
 * This directive is useful for hiding headers or navigation bars on scroll to maximize screen space.
 *
 * The directive uses a scroll threshold to prevent frequent toggling and is SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *  selector: 'app-header',
 *  template: `
 *    <header hideOnScroll>
 *      <!-- Header content -->
 *    </header>
 *  `,
 *  standalone: true,
 *  imports: [HideOnScroll]
 * })
 * export class HeaderComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[hideOnScroll]',
  standalone: true
})
export class HideOnScroll implements OnInit, AfterViewInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private prevScrollPos: number = 0;
  private scrollThreshold: number = 20;
  private visible: boolean = true;

  ngOnInit(): void {
    this.updateVisibility(true);
  }

  ngAfterViewInit(): void {
    // Initial scroll position
    if (isPlatformBrowser(this.platformId)) {
      this.prevScrollPos = window.scrollY;
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(_event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const currentScrollPos = window.scrollY;
    if (this.prevScrollPos - currentScrollPos > this.scrollThreshold) {
      this.updateVisibility(true);
    } else if (currentScrollPos - this.prevScrollPos > this.scrollThreshold) {
      this.updateVisibility(false);
    }

    this.prevScrollPos = currentScrollPos;
  }

  private updateVisibility(isVisible: boolean): void {
    if (this.visible !== isVisible) {
      this.visible = isVisible;
      this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s ease-in-out');
      if (isVisible) {
        this.renderer.removeStyle(this.el.nativeElement, 'transform');
      } else {
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-100%)');
      }
    }
  }
}

@NgModule({
  imports: [HideOnScroll],
  exports: [HideOnScroll]
})
export class HideOnScrollModule {}
