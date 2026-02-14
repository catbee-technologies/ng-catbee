import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  Renderer2,
  OnDestroy,
  PLATFORM_ID,
  NgModule,
  numberAttribute
} from '@angular/core';

/**
 * Directive that adds a Material Design ripple effect to elements.
 *
 * This directive creates an animated ripple effect when the element is clicked,
 * similar to Material Design's ripple effect. SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-button',
 *   template: `
 *     <button
 *       ripple
 *       [rippleColor]="'rgba(255, 255, 255, 0.5)'"
 *       [rippleDuration]="600">
 *       Click me
 *     </button>
 *
 *     <div
 *       ripple
 *       [rippleColor]="'rgba(0, 123, 255, 0.3)'"
 *       [rippleCentered]="true"
 *       class="card">
 *       Card with centered ripple
 *     </div>
 *   `,
 *   standalone: true,
 *   imports: [Ripple],
 *   styles: [`
 *     button, .card {
 *       position: relative;
 *       overflow: hidden;
 *     }
 *   `]
 * })
 * export class CustomButtonComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[ripple]',
  standalone: true
})
export class Ripple implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly rippleElements = new Set<HTMLElement>();

  /** Ripple color (default: 'rgba(0,0,0,0.25)') */
  readonly rippleColor = input<string>('rgba(0,0,0,0.25)');

  /** Animation duration (ms) (default: 400) */
  readonly rippleDuration = input(400, { transform: numberAttribute });

  /** Start ripple from center (default: false) */
  readonly rippleCentered = input<boolean>(false);

  /** Disable ripple (default: false) */
  readonly rippleDisabled = input<boolean>(false);

  /** Custom radius (default: null) */
  readonly rippleRadius = input<number | null>(null);

  /** Allow ripple outside container (default: false) */
  readonly rippleUnbounded = input<boolean>(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const host = this.el.nativeElement;
    const style = window.getComputedStyle(host);

    /** Fix inline elements */
    if (style.display === 'inline') {
      this.renderer.setStyle(host, 'display', 'inline-block');
    }

    /** Ensure positioning without overriding intentional layouts */
    if (style.position === 'static') {
      this.renderer.setStyle(host, 'position', 'relative');
    }

    /** Only hide overflow when bounded */
    if (!this.rippleUnbounded() && style.overflow === 'visible') {
      this.renderer.setStyle(host, 'overflow', 'hidden');
    }
  }

  // Pointer handles mouse + touch + pen
  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rippleDisabled()) return;
    if (event.button !== 0) return; // left click only

    this.createRipple(event.clientX, event.clientY);
  }

  @HostListener('keydown.enter')
  @HostListener('keydown.space')
  onKeydown() {
    if (this.rippleDisabled()) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    this.createRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  ngOnDestroy(): void {
    this.rippleElements.forEach(ripple => ripple.remove());
    this.rippleElements.clear();
  }

  private createRipple(clientX: number, clientY: number) {
    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();

    const x = this.rippleCentered() ? rect.width / 2 : clientX - rect.left;

    const y = this.rippleCentered() ? rect.height / 2 : clientY - rect.top;

    // Correct farthest-corner radius
    const maxX = Math.max(x, rect.width - x);
    const maxY = Math.max(y, rect.height - y);

    const radius = this.rippleRadius() ?? Math.sqrt(maxX * maxX + maxY * maxY);

    const ripple = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(ripple, 'ng-ripple');

    // Styles
    this.renderer.setStyle(ripple, 'position', 'absolute');
    this.renderer.setStyle(ripple, 'border-radius', '50%');
    this.renderer.setStyle(ripple, 'pointer-events', 'none');
    this.renderer.setStyle(ripple, 'background-color', this.rippleColor());
    this.renderer.setStyle(ripple, 'width', `${radius * 2}px`);
    this.renderer.setStyle(ripple, 'height', `${radius * 2}px`);
    this.renderer.setStyle(ripple, 'left', `${x - radius}px`);
    this.renderer.setStyle(ripple, 'top', `${y - radius}px`);

    // GPU acceleration
    this.renderer.setStyle(ripple, 'will-change', 'transform, opacity');
    this.renderer.setStyle(ripple, 'transform', 'scale(0)');
    this.renderer.setStyle(ripple, 'opacity', '1');

    this.renderer.setStyle(
      ripple,
      'transition',
      `transform ${this.rippleDuration()}ms ease-out, opacity ${this.rippleDuration()}ms ease-out`
    );

    this.renderer.appendChild(host, ripple);
    this.rippleElements.add(ripple);
    ripple.getBoundingClientRect();

    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });

    // Remove via transition event (no timers)
    ripple.addEventListener(
      'transitionend',
      () => {
        ripple.remove();
        this.rippleElements.delete(ripple);
      },
      { once: true }
    );
  }
}

@NgModule({
  imports: [Ripple],
  exports: [Ripple]
})
export class RippleModule {}
