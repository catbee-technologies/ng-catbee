import { isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  Directive,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  NgModule,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  effect,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';

export enum Position {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}
export type TooltipPosition = `${Position}`;
export type TooltipEvent = 'hover' | 'focus' | 'click';
export interface TooltipCoords {
  top: number;
  left: number;
}

/**
 * Directive that displays a customizable tooltip on elements.
 *
 * This directive is useful for providing contextual help information,
 * keyboard shortcuts, and additional explanations. Supports various
 * positioning strategies with automatic fallback, template content,
 * and multiple trigger modes. SSR-safe.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-button-group',
 *   template: `
 *     <button
 *       tooltip="Save your changes"
 *       tooltipPosition="top"
 *       tooltipEvent="hover">
 *       Save
 *     </button>
 *
 *     <button
 *       [tooltip]="deleteConfirmTemplate"
 *       tooltipPosition="bottom"
 *       tooltipDelay="300"
 *       tooltipEvent="click">
 *       Delete
 *     </button>
 *
 *     <ng-template #deleteConfirmTemplate>
 *       <div>Are you sure you want to delete?</div>
 *     </ng-template>
 *   `,
 *   standalone: true,
 *   imports: [Tooltip]
 * })
 * export class ButtonGroupComponent {}
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: '[tooltip]',
  standalone: true
})
export class Tooltip implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewContainerRef = inject(ViewContainerRef);

  private tooltipEl?: HTMLElement;
  private arrowEl?: HTMLElement;

  private showTimeout?: ReturnType<typeof setTimeout>;
  private cleanupFns: (() => void)[] = [];

  private scrollHandler = () => this.positionTooltip();
  private resizeHandler = () => this.positionTooltip();

  /** The content to display inside the tooltip. Can be a string or an Angular template. (default: '') */
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  readonly tooltip = input<string | TemplateRef<any>>();

  /** Preferred position of the tooltip relative to the host element (default: 'bottom'). */
  readonly tooltipPosition = input<TooltipPosition>(Position.BOTTOM);

  /** Delay in milliseconds before showing the tooltip after trigger event (default: 0). */
  readonly tooltipDelay = input<number>(0);

  /** CSS class to apply to the tooltip element for custom styling (default: 'catbee-tooltip'). */
  readonly tooltipClass = input<string>('catbee-tooltip');

  /** Whether the tooltip is disabled (default: false). */
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });

  /** Event that triggers the tooltip (default: 'hover'). */
  readonly tooltipEvent = input<TooltipEvent>('hover');

  private readonly baseTooltipStyles = {
    position: 'fixed',
    'z-index': '10000',
    'pointer-events': 'auto',
    padding: '8px 10px',
    'background-color': '#333',
    color: '#fff',
    'border-radius': '4px',
    'font-size': '14px',
    'white-space': 'nowrap',
    opacity: '0',
    transition: 'opacity 140ms ease, transform 140ms ease',
    'will-change': 'transform, opacity'
  };

  private readonly arrowSize = 8;
  private readonly arrowProjection = this.arrowSize / Math.SQRT2;
  private readonly baseArrowStyles = {
    position: 'absolute',
    width: `${this.arrowSize}px`,
    height: `${this.arrowSize}px`,
    background: '#333',
    transform: 'rotate(45deg)'
  };
  private readonly gap = 4;
  private readonly tooltipOffset = this.gap + this.arrowProjection / 2;
  private readonly fallbackPlacements: Position[] = [Position.TOP, Position.BOTTOM, Position.RIGHT, Position.LEFT];

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    /** Re-bind listeners whenever trigger or disabled state changes. */
    effect(() => {
      this.removeListeners();

      if (this.tooltipDisabled()) {
        this.hide();
        return;
      }

      this.addListeners();
    });
  }

  private addListeners() {
    const tooltipEvent = this.tooltipEvent();
    const el = this.el.nativeElement;

    const listen = (event: string, handler: EventListener) => {
      el.addEventListener(event, handler);
      this.cleanupFns.push(() => el.removeEventListener(event, handler));
    };

    switch (tooltipEvent) {
      case 'hover':
        listen('pointerenter', this.show);
        listen('pointerleave', this.hide);
        break;

      case 'focus':
        listen('focus', this.show);
        listen('blur', this.hide);
        break;

      case 'click':
        listen('click', this.toggle);
        break;
    }

    listen('keydown', this.handleEscape);
  }

  private removeListeners() {
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  private show = () => {
    if (!this.tooltip()) return;

    this.clearTimer();

    if (this.tooltipDelay() > 0) {
      this.showTimeout = setTimeout(() => {
        this.showTimeout = undefined;
        if (this.tooltipDisabled()) return;
        this.createTooltip();
      }, this.tooltipDelay());
      return;
    }
    this.createTooltip();
  };

  private hide = () => {
    this.clearTimer();
    this.destroyTooltip();
  };

  private toggle = () => {
    if (this.tooltipEl) {
      this.hide();
      return;
    }
    this.show();
  };

  private handleEscape = (e: Event) => {
    if ((e as KeyboardEvent).key === 'Escape') {
      this.hide();
    }
  };

  private clearTimer = () => {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = undefined;
    }
  };

  private createTooltip() {
    if (this.tooltipEl || this.tooltipDisabled()) return;

    const tooltip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(tooltip, this.tooltipClass());
    for (const [k, v] of Object.entries(this.baseTooltipStyles)) {
      this.renderer.setStyle(tooltip, k, v);
    }

    const content = this.renderer.createElement('div') as HTMLElement;
    if (this.tooltip() instanceof TemplateRef) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const view = this.viewContainerRef.createEmbeddedView(this.tooltip() as TemplateRef<any>);
      view.rootNodes.forEach(node => this.renderer.appendChild(tooltip, node));
    } else {
      this.renderer.setProperty(content, 'textContent', this.tooltip());
      this.renderer.appendChild(tooltip, content);
    }

    const arrow = this.renderer.createElement('div') as HTMLElement;
    for (const [k, v] of Object.entries(this.baseArrowStyles)) {
      this.renderer.setStyle(arrow, k, v);
    }
    this.renderer.appendChild(tooltip, content);
    this.renderer.appendChild(tooltip, arrow);

    this.renderer.appendChild(this.document.body, tooltip);
    this.tooltipEl = tooltip;
    this.arrowEl = arrow;
    const id = `catbee-tooltip-${crypto.randomUUID().replace(/-/g, '')}`;
    tooltip.id = id;

    this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', id);

    requestAnimationFrame(() => {
      this.positionTooltip();
      requestAnimationFrame(() => {
        if (!this.tooltipEl) return;
        this.tooltipEl.style.opacity = '1';
      });
    });

    if (this.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler, true);
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  private positionTooltip() {
    if (!this.tooltipEl) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();

    const offset = this.tooltipOffset;

    const preferred = this.tooltipPosition() as Position;
    const placements: Position[] = [preferred, ...this.fallbackPlacements.filter(p => p !== preferred)];

    for (const placement of placements) {
      const coords = this.getCoords(placement, hostRect, tooltipRect, offset);

      if (this.fitsViewport(coords, tooltipRect)) {
        this.applyCoords(coords);
        if (this.arrowEl) {
          this.positionArrow(this.arrowEl, placement);
          this.updateArrowPosition(this.arrowEl, hostRect, this.tooltipEl.getBoundingClientRect(), placement);
        }
        return;
      }
    }

    this.applyCoords({
      top: Math.max(8, hostRect.bottom + offset),
      left: Math.max(8, hostRect.left)
    });
  }

  private positionArrow(arrow: HTMLElement, placement: Position): void {
    const size = this.arrowSize / 2;

    switch (placement) {
      case Position.TOP:
        arrow.style.bottom = `-${size}px`;
        arrow.style.left = '50%';
        arrow.style.translate = '-50% 0';
        break;

      case Position.BOTTOM:
        arrow.style.top = `-${size}px`;
        arrow.style.left = '50%';
        arrow.style.translate = '-50% 0';
        break;

      case Position.LEFT:
        arrow.style.right = `-${size}px`;
        arrow.style.top = '50%';
        arrow.style.translate = '0 -50%';
        break;

      case Position.RIGHT:
        arrow.style.left = `-${size}px`;
        arrow.style.top = '50%';
        arrow.style.translate = '0 -50%';
        break;
    }
  }

  private updateArrowPosition(arrow: HTMLElement, hostRect: DOMRect, tooltipRect: DOMRect, placement: Position) {
    if (placement === Position.TOP || placement === Position.BOTTOM) {
      const hostCenter = hostRect.left + hostRect.width / 2;
      const arrowLeft = hostCenter - tooltipRect.left;

      arrow.style.left = `${arrowLeft}px`;
      arrow.style.translate = '-50% 0';
    } else {
      const hostCenter = hostRect.top + hostRect.height / 2;
      const arrowTop = hostCenter - tooltipRect.top;

      arrow.style.top = `${arrowTop}px`;
      arrow.style.translate = '0 -50%';
    }
  }

  private getCoords(position: Position, host: DOMRect, tip: DOMRect, offset: number) {
    switch (position) {
      case Position.TOP:
        return {
          top: host.top - tip.height - offset,
          left: host.left + (host.width - tip.width) / 2
        };

      case Position.BOTTOM:
        return {
          top: host.bottom + offset,
          left: host.left + (host.width - tip.width) / 2
        };

      case Position.LEFT:
        return {
          top: host.top + (host.height - tip.height) / 2,
          left: host.left - tip.width - offset
        };

      case Position.RIGHT:
        return {
          top: host.top + (host.height - tip.height) / 2,
          left: host.right + offset
        };
    }
  }

  private fitsViewport(coords: TooltipCoords, tip: DOMRect): boolean {
    return (
      coords.top >= 0 &&
      coords.left >= 0 &&
      coords.top + tip.height <= window.innerHeight &&
      coords.left + tip.width <= window.innerWidth
    );
  }

  private applyCoords(coords: TooltipCoords): void {
    if (!this.tooltipEl) return;
    this.renderer.setStyle(this.tooltipEl, 'top', `${coords.top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${coords.left}px`);
  }

  private destroyTooltip = () => {
    if (!this.tooltipEl) return;
    this.tooltipEl.remove();
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
    this.tooltipEl = undefined;
    this.arrowEl = undefined;
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      window.removeEventListener('resize', this.resizeHandler);
    }
  };

  private get isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  ngOnDestroy(): void {
    this.removeListeners();
    this.destroyTooltip();
    this.clearTimer();
  }
}

@NgModule({
  imports: [Tooltip],
  exports: [Tooltip]
})
export class TooltipModule {}
