import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  DOCUMENT,
  ElementRef,
  HostListener,
  inject,
  input,
  NgModule,
  OnDestroy,
  PLATFORM_ID,
  Renderer2
} from '@angular/core';

/**
 * Position options for the tooltip.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Directive that displays a tooltip on hover.
 *
 * This directive creates a simple, accessible tooltip that appears when
 * hovering over an element. SSR-safe and keyboard accessible.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-icon-button',
 *   template: `
 *     <button
 *       [tooltip]="'Click to save'"
 *       [tooltipPosition]="'top'"
 *       [tooltipDelay]="200">
 *       <i class="save-icon"></i>
 *     </button>
 *   `,
 *   standalone: true,
 *   imports: [Tooltip]
 * })
 * export class IconButtonComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[tooltip]',
  standalone: true
})
export class Tooltip implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * The tooltip text to display.
   */
  readonly tooltip = input<string>('');

  /**
   * Position of the tooltip relative to the element (default: 'top').
   */
  readonly tooltipPosition = input<TooltipPosition>('top');

  /**
   * Delay in milliseconds before showing tooltip (default: 0).
   */
  readonly tooltipDelay = input<number>(0);

  /**
   * Custom CSS class to apply to the tooltip.
   */
  readonly tooltipClass = '';

  @HostListener('mouseenter')
  @HostListener('focus')
  onShow(): void {
    if (!isPlatformBrowser(this.platformId) || !this.tooltip) {
      return;
    }

    this.showTimeout = setTimeout(() => {
      this.createTooltip();
    }, this.tooltipDelay());
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onHide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.destroyTooltip();
  }

  ngOnDestroy(): void {
    this.destroyTooltip();
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
  }

  private createTooltip(): void {
    if (this.tooltipElement) {
      return;
    }

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'ng-catbee-tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);

    if (this.tooltipClass) {
      this.renderer.addClass(this.tooltipElement, this.tooltipClass);
    }

    const text = this.renderer.createText(this.tooltip());
    this.renderer.appendChild(this.tooltipElement, text);

    // Add basic styles
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '10000');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', '#fff');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '14px');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipElement, 'pointer-events', 'none');

    // Append to body
    this.renderer.appendChild(this.document.body, this.tooltipElement);

    // Position the tooltip
    this.positionTooltip();
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) {
      return;
    }

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const offset = 8; // Gap between element and tooltip

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition()) {
      case 'top':
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + offset;
        break;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top + window.scrollY}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left + window.scrollX}px`);
  }

  private destroyTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(this.document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}

@NgModule({
  imports: [Tooltip],
  exports: [Tooltip]
})
export class TooltipModule {}
