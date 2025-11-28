import { ModuleWithProviders, NgModule } from '@angular/core';
import { CatbeeIndexedDBConfig } from './indexed-db.types';
import { CATBEE_INDEXED_DB_CONFIG } from './indexed-db.config';
import { CatbeeIndexedDBService } from './indexed-db.service';

/**
 * Catbee IndexedDB Module.
 *
 * To use, import `CatbeeIndexedDBModule` in your Angular module:
 * ```typescript
 * import { CatbeeIndexedDBModule } from '@ng-catbee/indexed-db';
 * ```
 *
 * Or
 *
 * use `provideCatbeeIndexedDB` to provide global configuration.
 * ```typescript
 * import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';
 * ```
 */
@NgModule({
  providers: [CatbeeIndexedDBService]
})
export class CatbeeIndexedDBModule {
  /** Or use `provideCatbeeIndexedDB` instead. from `@ng-catbee/indexed-db` */
  static forRoot(config?: CatbeeIndexedDBConfig): ModuleWithProviders<CatbeeIndexedDBModule> {
    return {
      ngModule: CatbeeIndexedDBModule,
      providers: [{ provide: CATBEE_INDEXED_DB_CONFIG, useValue: config }]
    };
  }
}
