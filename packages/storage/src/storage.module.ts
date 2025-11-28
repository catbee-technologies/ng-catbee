import { ModuleWithProviders, NgModule } from '@angular/core';
import { SessionStorageService } from './session-storage.service';
import { LocalStorageService } from './local-storage.service';
import { CatbeeStorageConfig } from './storage.types';
import { CATBEE_STORAGE_CONFIG } from './storage.config';

/**
 * This module provides services for localStorage and sessionStorage with configurable encoding strategies.
 *
 * To use, import `CatbeeStorageModule` in your Angular module:
 * ```typescript
 * import { CatbeeStorageModule } from '@ng-catbee/storage';
 * ```
 *
 * Or
 *
 * use `provideCatbeeStorage` to provide global configuration.
 * ```typescript
 * import { provideCatbeeStorage } from '@ng-catbee/storage';
 * ```
 */
@NgModule({
  providers: [LocalStorageService, SessionStorageService]
})
export class CatbeeStorageModule {
  /** Or use `provideCatbeeStorage` instead. from `@ng-catbee/storage` */
  static forRoot(config?: CatbeeStorageConfig): ModuleWithProviders<CatbeeStorageModule> {
    return {
      ngModule: CatbeeStorageModule,
      providers: [{ provide: CATBEE_STORAGE_CONFIG, useValue: config }]
    };
  }
}
