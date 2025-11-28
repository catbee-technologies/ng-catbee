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
  NgModule
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
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private rippleElements: HTMLElement[] = [];

  /**
   * Color of the ripple effect (default: 'rgba(255, 255, 255, 0.3)').
   */
  readonly rippleColor = input<string>('rgba(255, 255, 255, 0.3)');

  /**
   * Duration of the ripple animation in milliseconds (default: 600).
   */
  readonly rippleDuration = input<number>(600);

  /**
   * Whether the ripple should always start from the center (default: false).
   */
  readonly rippleCentered = input<boolean>(false);

  /**
   * Whether the ripple effect is disabled (default: false).
   */
  readonly rippleDisabled = input<boolean>(false);

  /**
   * Radius of the ripple effect. If not set, it will be calculated automatically.
   */
  readonly rippleRadius = input<number | null>(null);

  constructor() {
    // Ensure the host element has position relative or absolute
    if (isPlatformBrowser(this.platformId)) {
      const position = window.getComputedStyle(this.elementRef.nativeElement).position;
      if (position === 'static') {
        this.renderer.setStyle(this.elementRef.nativeElement, 'position', 'relative');
      }
      this.renderer.setStyle(this.elementRef.nativeElement, 'overflow', 'hidden');
    }
  }

  @HostListener('click', ['$event'])
  @HostListener('touchstart', ['$event'])
  onClick(event: MouseEvent | TouchEvent): void {
    if (!isPlatformBrowser(this.platformId) || this.rippleDisabled()) {
      return;
    }

    this.createRipple(event);
  }

  ngOnDestroy(): void {
    // Clean up any remaining ripple elements
    this.rippleElements.forEach(ripple => {
      if (ripple.parentNode) {
        this.renderer.removeChild(ripple.parentNode, ripple);
      }
    });
    this.rippleElements = [];
  }

  private createRipple(event: MouseEvent | TouchEvent): void {
    const hostElement = this.elementRef.nativeElement as HTMLElement;
    const rect = hostElement.getBoundingClientRect();

    // Calculate ripple position
    let x: number;
    let y: number;

    if (this.rippleCentered()) {
      x = rect.width / 2;
      y = rect.height / 2;
    } else {
      if (event instanceof MouseEvent) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      } else {
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      }
    }

    // Calculate ripple size
    const radius = this.rippleRadius() ?? Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));

    // Create ripple element
    const ripple = this.renderer.createElement('span');
    this.renderer.addClass(ripple, 'ng-catbee-ripple');

    // Set styles
    this.renderer.setStyle(ripple, 'position', 'absolute');
    this.renderer.setStyle(ripple, 'border-radius', '50%');
    this.renderer.setStyle(ripple, 'pointer-events', 'none');
    this.renderer.setStyle(ripple, 'background-color', this.rippleColor());
    this.renderer.setStyle(ripple, 'transform', 'scale(0)');
    this.renderer.setStyle(ripple, 'opacity', '1');
    this.renderer.setStyle(ripple, 'width', `${radius * 2}px`);
    this.renderer.setStyle(ripple, 'height', `${radius * 2}px`);
    this.renderer.setStyle(ripple, 'left', `${x - radius}px`);
    this.renderer.setStyle(ripple, 'top', `${y - radius}px`);
    this.renderer.setStyle(
      ripple,
      'transition',
      `transform ${this.rippleDuration()}ms ease-out, opacity ${this.rippleDuration()}ms ease-out`
    );

    // Append to host
    this.renderer.appendChild(hostElement, ripple);
    this.rippleElements.push(ripple);

    // Trigger animation
    requestAnimationFrame(() => {
      this.renderer.setStyle(ripple, 'transform', 'scale(1)');
      this.renderer.setStyle(ripple, 'opacity', '0');
    });

    // Remove ripple after animation completes
    setTimeout(() => {
      if (ripple.parentNode) {
        this.renderer.removeChild(ripple.parentNode, ripple);
      }
      const index = this.rippleElements.indexOf(ripple);
      if (index > -1) {
        this.rippleElements.splice(index, 1);
      }
    }, this.rippleDuration());
  }
}

@NgModule({
  imports: [Ripple],
  exports: [Ripple]
})
export class RippleModule {}
