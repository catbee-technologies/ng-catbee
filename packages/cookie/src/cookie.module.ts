import { ModuleWithProviders, NgModule } from '@angular/core';
import { CookieService } from './cookie.service';
import { CookieOptions } from './cookie.types';
import { CATBEE_COOKIE_CONFIG } from './cookie.config';

/**
 * This module provides cookie management services with configurable encoding options.
 *
 * To use, import `CatbeeCookieModule` in your Angular module:
 * ```typescript
 * import { CatbeeCookieModule } from '@ng-catbee/cookie';
 * ```
 *
 * Or
 *
 * use `provideCatbeeCookie` to provide global configuration.
 * ```typescript
 * import { provideCatbeeCookie } from '@ng-catbee/cookie';
 * ```
 */
@NgModule({
  providers: [CookieService]
})
export class CatbeeCookieModule {
  /** Or use `provideCatbeeCookie` instead. from `@ng-catbee/cookie` */
  static forRoot(config?: CookieOptions): ModuleWithProviders<CatbeeCookieModule> {
    return {
      ngModule: CatbeeCookieModule,
      providers: [{ provide: CATBEE_COOKIE_CONFIG, useValue: config }]
    };
  }
}
