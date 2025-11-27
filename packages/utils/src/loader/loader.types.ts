/** Loader animation element counts for different loader types */
export const ANIMATION_ELEMENTS: Readonly<Record<string, number>> = {
  'ball-8bits': 16,
  'ball-atom': 4,
  'ball-beat': 3,
  'ball-circus': 5,
  'ball-climbing-dot': 4,
  'ball-clip-rotate': 1,
  'ball-clip-rotate-multiple': 2,
  'ball-clip-rotate-pulse': 2,
  'ball-elastic-dots': 5,
  'ball-fall': 3,
  'ball-fussion': 4,
  'ball-grid-beat': 9,
  'ball-grid-pulse': 9,
  'ball-newton-cradle': 4,
  'ball-pulse': 3,
  'ball-pulse-rise': 5,
  'ball-pulse-sync': 3,
  'ball-rotate': 1,
  'ball-running-dots': 5,
  'ball-scale': 1,
  'ball-scale-multiple': 3,
  'ball-scale-pulse': 2,
  'ball-scale-ripple': 1,
  'ball-scale-ripple-multiple': 3,
  'ball-spin': 8,
  'ball-spin-clockwise': 8,
  'ball-spin-clockwise-fade': 8,
  'ball-spin-clockwise-fade-rotating': 8,
  'ball-spin-fade': 8,
  'ball-spin-fade-rotating': 8,
  'ball-spin-rotate': 2,
  'ball-square-clockwise-spin': 8,
  'ball-square-spin': 8,
  'ball-triangle-path': 3,
  'ball-zig-zag': 2,
  'ball-zig-zag-deflect': 2,
  cog: 1,
  'cube-transition': 2,
  fire: 3,
  'line-scale': 5,
  'line-scale-party': 5,
  'line-scale-pulse-out': 5,
  'line-scale-pulse-out-rapid': 5,
  'line-spin-clockwise-fade': 8,
  'line-spin-clockwise-fade-rotating': 8,
  'line-spin-fade': 8,
  'line-spin-fade-rotating': 8,
  pacman: 6,
  'square-jelly-box': 2,
  'square-loader': 1,
  'square-spin': 1,
  timer: 1,
  'triangle-skew-spin': 1
} as const;

export const SIZE_CLASS_MAP: Readonly<Record<LoaderSize, string>> = {
  small: 'la-sm',
  medium: 'la-2x',
  large: 'la-3x'
};

/** Default configuration values */
export const LOADER_DEFAULTS = {
  BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.7)',
  LOADER_COLOR: '#ffffff',
  Z_INDEX: 999999,
  SIZE: '' as LoaderSize,
  ANIMATION: 'ball-spin-clockwise' as LoaderAnimation,
  FULLSCREEN: true,
  BLOCK_SCROLL: true,
  NAME: 'default'
} as const;

/** Loader size options */
export type LoaderSize = 'small' | 'medium' | 'large';

/** Loader animation types */
export type LoaderAnimation = keyof typeof ANIMATION_ELEMENTS;

/** Loader visibility state */
export interface LoaderState {
  readonly name: string;
  readonly visible: boolean;
  readonly backgroundColor?: string;
  readonly loaderColor?: string;
  readonly size?: LoaderSize;
  readonly animation?: LoaderAnimation;
  readonly fullscreen?: boolean;
  readonly zIndex?: number;
  readonly customTemplate?: string;
  readonly message?: string;
  readonly blockScroll?: boolean;
}

/** Configuration options for displaying a loader */
export interface LoaderDisplayOptions {
  backgroundColor?: string;
  loaderColor?: string;
  size?: LoaderSize;
  animation?: LoaderAnimation;
  fullscreen?: boolean;
  zIndex?: number;
  customTemplate?: string;
  message?: string;
  blockScroll?: boolean;
}

/** Internal loader data structure */
export interface LoaderData {
  name: string;
  backgroundColor: string;
  loaderColor: string;
  size: LoaderSize;
  animation: LoaderAnimation;
  elementCount: number;
  elements: readonly number[];
  cssClass: string;
  fullscreen: boolean;
  visible: boolean;
  zIndex: number;
  customTemplate: string | null;
  message: string | null;
  blockScroll: boolean;
}
