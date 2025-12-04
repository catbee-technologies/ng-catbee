/** Global configuration for loaders */
export interface CatbeeLoaderGlobalConfig {
  /**
   * Default animation type for all loaders
   * @link https://labs.danielcardoso.net/load-awesome/animations.html
   */
  animation?: CatbeeLoaderAnimation;
  /** Default size for all loaders - 'default' | 'small' | 'medium' | 'large' */
  size?: CatbeeLoaderSize;
  /** Default overlay color */
  backgroundColor?: string;
  /** Default loader color */
  loaderColor?: string;
  /** Default z-index */
  zIndex?: number;
  /** Default fullscreen mode for loaders */
  fullscreen?: boolean;
  /** Default message to display below loaders */
  message?: string | null;
  /** Default custom template for loaders */
  customTemplate?: string | null;
  /** Whether to apply a blur effect to the background when the loader is visible */
  blurBackground?: boolean;
  /** Amount of blur in pixels to apply to the background when blurBackground is true, Default is 5 */
  blurPixels?: number;
}

/** Loader visibility state */
export interface CatbeeLoaderState extends Readonly<CatbeeLoaderGlobalConfig> {
  readonly name: string;
  readonly visible: boolean;
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Internal loader data structure
 *
 * @internal
 */
export type CatbeeLoaderData = Mutable<Required<CatbeeLoaderState>> & {
  elementCount: number;
  elements: number[];
  cssClass: string;
};

/** Default configuration values */
export const CATBEE_LOADER_DEFAULTS: Required<Omit<CatbeeLoaderGlobalConfig, 'customTemplate' | 'message'>> & {
  name: string;
} = {
  name: 'default',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  loaderColor: '#ffffff',
  zIndex: 999999,
  size: 'default',
  animation: 'ball-spin-clockwise',
  fullscreen: true,
  blurBackground: false,
  blurPixels: 5
} as const;

/** Loader animation element counts for different loader types */
export const ANIMATION_ELEMENTS = {
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

export enum CATBEE_SIZE_CLASS {
  default = '',
  small = 'catbee-loader-sm',
  medium = 'catbee-loader-md',
  large = 'catbee-loader-lg'
}

export enum LOAD_AWESOME_SIZE_CLASS {
  default = '',
  small = 'la-sm',
  medium = 'la-2x',
  large = 'la-3x'
}

/**
 * Loader size options are 'default' 'small', 'medium', 'large'
 * @public
 */
export type CatbeeLoaderSize = 'default' | 'small' | 'medium' | 'large';

/**
 * Loader animation types
 * @link https://labs.danielcardoso.net/load-awesome/animations.html
 *
 * @example
 * To use a specific loader animation, include the corresponding CSS file from the `load-awesome` library in your project. For instance, to use the `ball-spin-clockwise-fade` animation, add the following to your Angular project's `angular.json` file under the `styles` array:
 * ```json
 * "styles": [
 *   "node_modules/load-awesome/css/ball-8bits.min.css",
 *   "node_modules/load-awesome/css/ball-pulse.min.css",
 *   "node_modules/load-awesome/css/ball-spin-clockwise-fade.min.css"
 * ]
 * ```
 *
 * @public
 */
export type CatbeeLoaderAnimation = keyof typeof ANIMATION_ELEMENTS;
