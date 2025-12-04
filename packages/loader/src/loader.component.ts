import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
  OnInit,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatbeeLoaderService } from './loader.service';
import {
  ANIMATION_ELEMENTS,
  CATBEE_LOADER_DEFAULTS,
  CatbeeLoaderAnimation,
  CatbeeLoaderSize,
  CatbeeLoaderData,
  LOAD_AWESOME_SIZE_CLASS,
  CATBEE_SIZE_CLASS
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
 * import { Component, inject } from '@angular/core';
 * import { CatbeeLoaderService } from '@ng-catbee/loader';
 *
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
        [class.catbee-loader-blur]="loaderData().fullscreen && loaderData().blurBackground"
        [style.background-color]="loaderData().backgroundColor"
        [style.z-index]="loaderData().zIndex"
        [style.--catbee-blur-amount]="blurAmount()"
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
  styleUrls: ['./loader.component.css', './css/ball-spin-clockwise.min.css']
})
export class CatbeeLoader implements OnInit {
  private readonly loaderService = inject(CatbeeLoaderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly globalConfig = inject(CATBEE_LOADER_GLOBAL_CONFIG, { optional: true });

  /** Unique name for this loader instance */
  readonly name = input<string>(CATBEE_LOADER_DEFAULTS.name);
  /** Overlay background color (supports RGBA, HEX, named colors) */
  readonly backgroundColor = input<string>();
  /** Loader color (supports CSS color values) */
  readonly loaderColor = input<string>();
  /** Loader size - 'default' 'small' | 'medium' | 'large' */
  readonly size = input<CatbeeLoaderSize>(CATBEE_LOADER_DEFAULTS.size);
  /** Loader width (supports CSS size values like px, %, em) */
  readonly width = input<string>();

  /** Loader height (supports CSS size values like px, %, em) */
  readonly height = input<string>();

  /** Animation type
   * @link https://labs.danielcardoso.net/load-awesome/animations.html */
  readonly animation = input<CatbeeLoaderAnimation>();

  /** Fullscreen overlay mode */
  readonly fullscreen = input<boolean>();

  /** Custom z-index value */
  readonly zIndex = input<number>();

  /** Custom HTML template for the loader */
  readonly customTemplate = input<string>();

  /** Loading message to display below loader */
  readonly message = input<string>();

  /** Whether to apply a blur effect to the background when the loader is visible */
  readonly blurBackground = input<boolean>();

  /** Amount of blur in pixels to apply to the background when blurBackground is true */
  readonly blurPixels = input<number>();

  /** Whether to block page scrolling when fullscreen loader is visible */
  readonly blockScroll = input<boolean>();

  /** Emits when loader visibility changes */
  readonly visibleChange = output<boolean>();

  private readonly currentState = signal<CatbeeLoaderData>({
    name: CATBEE_LOADER_DEFAULTS.name,
    backgroundColor: CATBEE_LOADER_DEFAULTS.backgroundColor,
    loaderColor: CATBEE_LOADER_DEFAULTS.loaderColor,
    size: CATBEE_LOADER_DEFAULTS.size,
    animation: CATBEE_LOADER_DEFAULTS.animation,
    elementCount: 0,
    elements: [],
    cssClass: '',
    fullscreen: CATBEE_LOADER_DEFAULTS.fullscreen,
    visible: false,
    zIndex: CATBEE_LOADER_DEFAULTS.zIndex,
    customTemplate: null,
    message: null,
    blurBackground: CATBEE_LOADER_DEFAULTS.blurBackground,
    blurPixels: CATBEE_LOADER_DEFAULTS.blurPixels,
    blockScroll: CATBEE_LOADER_DEFAULTS.blockScroll
  });

  // Track which properties were set via service (to distinguish from defaults)
  private readonly serviceOverrides = signal<Partial<CatbeeLoaderData>>({});

  readonly shouldRender = signal<boolean>(false);
  readonly isFadingOut = signal<boolean>(false);

  /** Computed loader data combining all inputs and state */
  readonly loaderData = computed(() => {
    const state = this.currentState();
    const overrides = this.serviceOverrides();

    // Priority: service overrides > component inputs > global config > defaults
    const animation =
      overrides.animation ?? this.animation() ?? this.globalConfig?.animation ?? CATBEE_LOADER_DEFAULTS.animation;
    const size = overrides.size ?? this.size() ?? this.globalConfig?.size ?? CATBEE_LOADER_DEFAULTS.size;
    const elementCount = ANIMATION_ELEMENTS[animation as CatbeeLoaderAnimation] ?? 1;

    return {
      name: this.name(),
      backgroundColor:
        overrides.backgroundColor ??
        this.backgroundColor() ??
        this.globalConfig?.backgroundColor ??
        CATBEE_LOADER_DEFAULTS.backgroundColor,
      loaderColor:
        overrides.loaderColor ??
        this.loaderColor() ??
        this.globalConfig?.loaderColor ??
        CATBEE_LOADER_DEFAULTS.loaderColor,
      size,
      animation,
      elementCount,
      elements: Array.from({ length: elementCount }, (_, i) => i),
      cssClass: this.getCssClassByAnimation(animation, size),
      fullscreen:
        overrides.fullscreen ?? this.fullscreen() ?? this.globalConfig?.fullscreen ?? CATBEE_LOADER_DEFAULTS.fullscreen,
      visible: state.visible,
      zIndex: overrides.zIndex ?? this.zIndex() ?? this.globalConfig?.zIndex ?? CATBEE_LOADER_DEFAULTS.zIndex,
      customTemplate: overrides.customTemplate ?? this.customTemplate() ?? this.globalConfig?.customTemplate ?? null,
      message: overrides.message ?? this.message() ?? this.globalConfig?.message ?? null,
      blurBackground:
        overrides.blurBackground ??
        this.blurBackground() ??
        this.globalConfig?.blurBackground ??
        CATBEE_LOADER_DEFAULTS.blurBackground,
      blurPixels:
        overrides.blurPixels ?? this.blurPixels() ?? this.globalConfig?.blurPixels ?? CATBEE_LOADER_DEFAULTS.blurPixels,
      blockScroll:
        overrides.blockScroll ??
        this.blockScroll() ??
        this.globalConfig?.blockScroll ??
        CATBEE_LOADER_DEFAULTS.blockScroll
    };
  });

  readonly blurAmount = computed(() => {
    const data = this.loaderData();
    return data.fullscreen && data.blurBackground ? `blur(${data.blurPixels}px)` : '';
  });

  ngOnInit(): void {
    this.watchLoader$();
  }

  private watchLoader$(): void {
    this.loaderService
      .watch(this.name())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        if (state.visible) {
          // Set visibility
          this.currentState.update(current => ({ ...current, visible: true }));

          // Store only the explicitly provided overrides
          const overrides: Partial<CatbeeLoaderData> = {};
          if (state.backgroundColor !== undefined) overrides.backgroundColor = state.backgroundColor;
          if (state.loaderColor !== undefined) overrides.loaderColor = state.loaderColor;
          if (state.size !== undefined) overrides.size = state.size;
          if (state.animation !== undefined) overrides.animation = state.animation;
          if (state.fullscreen !== undefined) overrides.fullscreen = state.fullscreen;
          if (state.zIndex !== undefined) overrides.zIndex = state.zIndex;
          if (state.customTemplate !== undefined) overrides.customTemplate = state.customTemplate;
          if (state.message !== undefined) overrides.message = state.message;
          if (state.blurBackground !== undefined) overrides.blurBackground = state.blurBackground;
          if (state.blurPixels !== undefined) overrides.blurPixels = state.blurPixels;
          if (state.blockScroll !== undefined) overrides.blockScroll = state.blockScroll;

          this.serviceOverrides.set(overrides);
          this.isFadingOut.set(false);
          this.shouldRender.set(true);
          this.visibleChange.emit(true);
        } else {
          // When hiding, clear overrides and set visible to false
          this.currentState.update(current => ({ ...current, visible: false }));

          if (this.shouldRender()) {
            this.isFadingOut.set(true);
            setTimeout(() => {
              this.shouldRender.set(false);
              this.isFadingOut.set(false);
              this.serviceOverrides.set({}); // Clear overrides
              this.visibleChange.emit(false);
            }, 200);
          }
        }
      });
  }

  private getCssClassByAnimation(animation: CatbeeLoaderAnimation, size: CatbeeLoaderSize): string {
    if (animation.startsWith('catbee-')) {
      const sizeClass = CATBEE_SIZE_CLASS[size];
      return `${animation}` + (sizeClass ? ` ${sizeClass}` : '');
    }
    const sizeClass = LOAD_AWESOME_SIZE_CLASS[size];
    return `la-${animation}` + (sizeClass ? ` ${sizeClass}` : '');
  }
}

/**
 * Public alias for the `CatbeeLoader` Angular component.
 *
 * This exported symbol is the recommended entrypoint for consumers who want to
 * use the Catbee Loader component in their Angular templates or standalone
 * components. It simply re-exports the underlying `CatbeeLoader` class without
 * modification.
 *
 * @alias CatbeeLoaderComponent
 * @see CatbeeLoader
 *
 * @remarks
 * Use this export when importing from the library:
 *
 * ```ts
 * import { CatbeeLoaderComponent } from '@ng-catbee/loader';
 * ```
 *
 * @example
 * ```ts
 * import { Component } from '@angular/core';
 * import { CatbeeLoaderComponent } from '@ng-catbee/loader';
 *
 * @Component({
 *   standalone: true,
 *   imports: [CatbeeLoaderComponent],
 *   template: `
 *     <ng-catbee-loader
 *       name="global-loader"
 *       size="lg"
 *       animation="ball-spin-fade"
 *       [fullscreen]="true"
 *     />
 *   `
 * })
 * export class AppComponent {}
 * ```
 *
 * @public
 */
export const CatbeeLoaderComponent = CatbeeLoader;
