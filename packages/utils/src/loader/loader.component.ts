import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  DOCUMENT,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatbeeLoaderService } from './loader.service';
import {
  ANIMATION_ELEMENTS,
  LOADER_DEFAULTS,
  LoaderAnimation,
  LoaderSize,
  LoaderData,
  SIZE_CLASS_MAP
} from './loader.types';
import { CATBEE_LOADER_GLOBAL_CONFIG } from './loader.config';

/**
 * Loading component with customizable animations and appearance.
 *
 * This component displays a loading overlay with various animation options.
 * It uses Angular signals for reactive state management and supports both
 * fullscreen and inline display modes.
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <ng-catbee-loader
 *       name="page-loader"
 *       animation="circle-spin-fade"
 *       size="lg"
 *       [fullscreen]="true"
 *     />
 *   `
 * })
 * export class PageComponent {
 *   private loader = inject(LoaderService);
 *
 *   async loadData() {
 *     await this.loader.show('page-loader');
 *     // ... load data
 *     await this.loader.hide('page-loader');
 *   }
 * }
 * ```
 *
 * @public
 */
@Component({
  selector: 'ng-catbee-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ng-catbee-loader' },
  template: `
    @if (shouldRender()) {
      <div
        class="catbee-loader"
        [class.catbee-loader-overlay]="loaderData().fullscreen"
        [class.fullscreen]="loaderData().fullscreen"
        [class.fading-out]="isFadingOut()"
        [style.background-color]="loaderData().backgroundColor"
        [style.z-index]="loaderData().zIndex"
      >
        <div class="ng-catbee-loader-container">
          @if (loaderData().customTemplate) {
            <div [innerHTML]="loaderData().customTemplate"></div>
          } @else {
            <div
              [style.width]="width() ? width() + 'px' : null"
              [style.height]="height() ? height() + 'px' : null"
              [class]="loaderData().cssClass"
              [style.color]="loaderData().loaderColor"
            >
              @for (item of loaderData().elements; track item) {
                <div></div>
              }
            </div>
          }

          @if (loaderData().message) {
            <div class="ng-catbee-loader-message">{{ loaderData().message }}</div>
          }

          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
  styles: `
    .catbee-loader {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 200ms ease-in;
      width: fit-content;
    }

    .catbee-loader.catbee-loader-overlay {
      position: absolute;
      inset: 0;
    }

    .catbee-loader.catbee-loader-overlay.fading-out {
      animation: fadeOut 200ms ease-out forwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .catbee-loader-overlay.fullscreen {
      position: fixed;
      width: 100dvw;
      height: 100dvh;
    }

    .ng-catbee-loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      position: relative;
    }

    .ng-catbee-loader-message {
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
      color: inherit;
      max-width: 20rem;
    }
  `
})
export class CatbeeLoader implements OnInit {
  private readonly loaderService = inject(CatbeeLoaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly globalConfig = inject(CATBEE_LOADER_GLOBAL_CONFIG, { optional: true });
  private readonly document = inject(DOCUMENT);

  /** Unique name for this loader instance */
  readonly name = input<string>(LOADER_DEFAULTS.NAME);

  /** Overlay background color (supports RGBA, HEX, named colors) */
  readonly backgroundColor = input<string>(LOADER_DEFAULTS.BACKGROUND_COLOR);

  /** Loader color */
  readonly loaderColor = input<string>(LOADER_DEFAULTS.LOADER_COLOR);

  /** Loader size */
  readonly size = input<LoaderSize>(LOADER_DEFAULTS.SIZE);

  /** Loader width */
  readonly width = input<string>();

  /** Loader height */
  readonly height = input<string>();

  /** Animation type */
  readonly animation = input<LoaderAnimation>();

  /** Fullscreen overlay mode */
  readonly fullscreen = input<boolean>(LOADER_DEFAULTS.FULLSCREEN);

  /** Custom z-index value */
  readonly zIndex = input<number>(LOADER_DEFAULTS.Z_INDEX);

  /** Custom HTML template for the loader */
  readonly customTemplate = input<string>();

  /** Loading message to display below loader */
  readonly message = input<string>();

  /** Block page scroll when loader is visible */
  readonly blockScroll = input<boolean>(LOADER_DEFAULTS.BLOCK_SCROLL);

  private readonly currentState = signal<LoaderData>({
    name: LOADER_DEFAULTS.NAME,
    backgroundColor: LOADER_DEFAULTS.BACKGROUND_COLOR,
    loaderColor: LOADER_DEFAULTS.LOADER_COLOR,
    size: LOADER_DEFAULTS.SIZE,
    animation: LOADER_DEFAULTS.ANIMATION,
    elementCount: 0,
    elements: [],
    cssClass: '',
    fullscreen: LOADER_DEFAULTS.FULLSCREEN,
    visible: false,
    zIndex: LOADER_DEFAULTS.Z_INDEX,
    customTemplate: null,
    message: null,
    blockScroll: LOADER_DEFAULTS.BLOCK_SCROLL
  });

  // Track which properties were set via service (to distinguish from defaults)
  private readonly serviceOverrides = signal<Partial<LoaderData>>({});

  readonly shouldRender = signal<boolean>(false);
  readonly isFadingOut = signal<boolean>(false);

  /** Computed loader data combining all inputs and state */
  readonly loaderData = computed(() => {
    const state = this.currentState();
    const overrides = this.serviceOverrides();

    // Priority: service overrides > component inputs > global config > defaults
    const animation =
      overrides.animation ?? this.animation() ?? this.globalConfig?.defaultAnimation ?? LOADER_DEFAULTS.ANIMATION;
    const size = overrides.size ?? this.size() ?? this.globalConfig?.defaultSize ?? LOADER_DEFAULTS.SIZE;
    const elementCount = ANIMATION_ELEMENTS[animation] ?? 1;

    return {
      name: this.name(),
      backgroundColor:
        overrides.backgroundColor ??
        this.backgroundColor() ??
        this.globalConfig?.defaultOverlayColor ??
        LOADER_DEFAULTS.BACKGROUND_COLOR,
      loaderColor:
        overrides.loaderColor ??
        this.loaderColor() ??
        this.globalConfig?.defaultLoaderColor ??
        LOADER_DEFAULTS.LOADER_COLOR,
      size,
      animation,
      elementCount,
      elements: Array.from({ length: elementCount }, (_, i) => i),
      cssClass: this.buildCssClass(animation, size),
      fullscreen: overrides.fullscreen ?? this.fullscreen() ?? LOADER_DEFAULTS.FULLSCREEN,
      visible: state.visible,
      zIndex: overrides.zIndex ?? this.zIndex() ?? this.globalConfig?.defaultZIndex ?? LOADER_DEFAULTS.Z_INDEX,
      customTemplate: overrides.customTemplate ?? this.customTemplate() ?? null,
      message: overrides.message ?? this.message() ?? null,
      blockScroll:
        overrides.blockScroll ??
        this.blockScroll() ??
        this.globalConfig?.defaultBlockScroll ??
        LOADER_DEFAULTS.BLOCK_SCROLL
    };
  });

  constructor() {
    // Handle scroll blocking based on loader visibility and blockScroll setting
    effect(() => {
      const data = this.loaderData();
      if (data.visible && data.blockScroll) {
        this.document.body.style.overflow = 'hidden !important';
      } else {
        this.document.body.style.overflow = '';
      }
    });
  }

  ngOnInit(): void {
    this.initObservable();
  }

  private initObservable(): void {
    this.loaderService
      .observe(this.name())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        console.log(`[${this.name()}] Loader state update:`, state);

        if (state.visible) {
          // Set visibility
          this.currentState.update(current => ({ ...current, visible: true }));

          // Store only the explicitly provided overrides
          const overrides: Partial<LoaderData> = {};
          if (state.backgroundColor !== undefined) overrides.backgroundColor = state.backgroundColor;
          if (state.loaderColor !== undefined) overrides.loaderColor = state.loaderColor;
          if (state.size !== undefined) overrides.size = state.size;
          if (state.animation !== undefined) overrides.animation = state.animation;
          if (state.fullscreen !== undefined) overrides.fullscreen = state.fullscreen;
          if (state.zIndex !== undefined) overrides.zIndex = state.zIndex;
          if (state.customTemplate !== undefined) overrides.customTemplate = state.customTemplate;
          if (state.message !== undefined) overrides.message = state.message;
          if (state.blockScroll !== undefined) overrides.blockScroll = state.blockScroll;

          this.serviceOverrides.set(overrides);
          this.isFadingOut.set(false);
          this.shouldRender.set(true);
        } else {
          // When hiding, clear overrides and set visible to false
          this.currentState.update(current => ({ ...current, visible: false }));

          if (this.shouldRender()) {
            this.isFadingOut.set(true);
            setTimeout(() => {
              this.shouldRender.set(false);
              this.isFadingOut.set(false);
              this.serviceOverrides.set({}); // Clear overrides
            }, 200);
          }
        }
      });
  }

  /**
   * Builds CSS class string for loader styling
   */
  private buildCssClass(animation: LoaderAnimation, size: LoaderSize): string {
    const sizeClass = SIZE_CLASS_MAP[size];
    const animationClass = `la-${animation}`;
    return `${animationClass} ${sizeClass ?? ''}`;
  }
}
