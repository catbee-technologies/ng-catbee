import { ModuleWithProviders, NgModule } from '@angular/core';
import { CatbeeLogger } from './logger.service';
import { CatbeeLoggerConfig } from './logger.types';
import { CATBEE_LOGGER_CONFIG } from './logger.config';

/**
 * Legacy module for `CatbeeLogger`.
 *
 * **Note**: For modern Angular applications (v14+), use `provideCatbeeLogger()` instead.
 *
 * @deprecated Use `provideCatbeeLogger()` for standalone components and modern Angular apps.
 *
 * @example
 * ```typescript
 * // Modern approach (recommended)
 * import { provideCatbeeLogger } from '@ng-catbee/logger';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideCatbeeLogger({ level: CatbeeLogLevel.INFO })]
 * };
 *
 * // Legacy approach (NgModule-based apps)
 * import { CatbeeLoggerModule } from '@ng-catbee/logger';
 *
 * @NgModule({
 *   imports: [CatbeeLoggerModule.forRoot({ level: CatbeeLogLevel.INFO })]
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({
  providers: [CatbeeLogger]
})
export class CatbeeLoggerModule {
  static forRoot(config?: CatbeeLoggerConfig): ModuleWithProviders<CatbeeLoggerModule> {
    return {
      ngModule: CatbeeLoggerModule,
      providers: [{ provide: CATBEE_LOGGER_CONFIG, useValue: config }]
    };
  }
}
