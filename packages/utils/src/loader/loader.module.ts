import { ModuleWithProviders, NgModule } from '@angular/core';
import { CatbeeLoader } from './loader.component';
import { CatbeeLoaderService } from './loader.service';
import { CATBEE_LOADER_GLOBAL_CONFIG, CatbeeLoaderGlobalConfig } from './loader.config';

/**
 * @ng-catbee/utils/loader module
 *
 * This module provides loader components and services for Angular applications.
 *
 * To use, import `CatbeeLoaderModule` in your Angular module:
 * ```typescript
 * import { CatbeeLoaderModule } from '@ng-catbee/utils';
 * ```
 *
 * Or
 *
 * use `provideCatbeeLoader` to provide global configuration.
 * ```typescript
 * import { provideCatbeeLoader } from '@ng-catbee/utils';
 * ```
 */
@NgModule({
  imports: [CatbeeLoader],
  providers: [CatbeeLoaderService],
  exports: [CatbeeLoader]
})
export class CatbeeLoaderModule {
  static forRoot(config?: CatbeeLoaderGlobalConfig): ModuleWithProviders<CatbeeLoaderModule> {
    return {
      ngModule: CatbeeLoaderModule,
      providers: [{ provide: CATBEE_LOADER_GLOBAL_CONFIG, useValue: config }]
    };
  }
}
