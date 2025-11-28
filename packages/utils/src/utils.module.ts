import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { PlatformService } from '@ng-catbee/utils/platform';
import { CATBEE_UTILS_CONFIG, CatbeeUtilsConfig } from '@ng-catbee/utils/config';
import { BrowserService } from '@ng-catbee/utils/browser';
import { LoggerService } from '@ng-catbee/utils/logger';
import {
  AbbreviateNumberPipe,
  BusinessDaysPipe,
  CamelCasePipe,
  CapitalizePipe,
  ChunkPipe,
  CreditCardPipe,
  DateRangePipe,
  DefaultValuePipe,
  DurationPipe,
  FileSizePipe,
  FilterPipe,
  FlattenPipe,
  GroupByPipe,
  HighlightPipe,
  KebabCasePipe,
  MaskPipe,
  OrdinalPipe,
  PercentageChangePipe,
  PhoneNumberPipe,
  PluckPipe,
  ReversePipe,
  SafeHtmlPipe,
  SafeUrlPipe,
  SlugPipe,
  SnakeCasePipe,
  SortPipe,
  TimeAgoPipe,
  TruncatePipe,
  UniquePipe
} from '@ng-catbee/utils/pipes';
import {
  AutoFocus,
  BlockCopyPaste,
  ClickOutside,
  CopyToClipboard,
  DebounceClick,
  DeepDisabled,
  HideOnScroll,
  InputMask,
  IntersectionObserverDirective,
  KeyFilter,
  LongPress,
  ResizeObserverDirective,
  Ripple,
  ScrollSpy,
  Tooltip
} from '@ng-catbee/utils/directives';

const components: never[] = [];

const directives = [
  AutoFocus,
  BlockCopyPaste,
  ClickOutside,
  CopyToClipboard,
  DebounceClick,
  DeepDisabled,
  HideOnScroll,
  InputMask,
  IntersectionObserverDirective,
  KeyFilter,
  LongPress,
  ResizeObserverDirective,
  Ripple,
  ScrollSpy,
  Tooltip
];

const pipes = [
  AbbreviateNumberPipe,
  BusinessDaysPipe,
  CamelCasePipe,
  CapitalizePipe,
  ChunkPipe,
  CreditCardPipe,
  DateRangePipe,
  DefaultValuePipe,
  DurationPipe,
  FileSizePipe,
  FilterPipe,
  FlattenPipe,
  GroupByPipe,
  HighlightPipe,
  KebabCasePipe,
  MaskPipe,
  OrdinalPipe,
  PercentageChangePipe,
  PhoneNumberPipe,
  PluckPipe,
  ReversePipe,
  SafeHtmlPipe,
  SafeUrlPipe,
  SlugPipe,
  SnakeCasePipe,
  SortPipe,
  TimeAgoPipe,
  TruncatePipe,
  UniquePipe
];

const services = [
  BrowserService,
  PlatformService,
  LoggerService
];

/** @ng-catbee/utils module
 *
 * This module provides a collection of utility components, directives, pipes, and services for Angular applications.
 *
 * To use, import `CatbeeUtilsModule` in your Angular module:
 * ```typescript
 * import { CatbeeUtilsModule } from '@ng-catbee/utils';
 * ```
 *
 * Or
 *
 * use `provideCatbeeUtils` to provide global configuration.
 * ```typescript
 * import { provideCatbeeUtils } from '@ng-catbee/utils';
 * ```
 */
@NgModule({
  imports: [CommonModule, ...components, ...pipes, ...directives],
  providers: [...services],
  exports: [...components, ...pipes, ...directives]
})
export class CatbeeUtilsModule {
  /** Or use `provideCatbeeUtils` instead. from `@ng-catbee/utils` */
  static forRoot(config?: CatbeeUtilsConfig): ModuleWithProviders<CatbeeUtilsModule> {
    return {
      ngModule: CatbeeUtilsModule,
      providers: [{ provide: CATBEE_UTILS_CONFIG, useValue: config }]
    };
  }
}
