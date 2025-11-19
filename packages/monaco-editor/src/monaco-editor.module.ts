import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { CatbeeMonacoEditorComponent } from './components/v1/monaco-editor';
import { CATBEE_MONACO_EDITOR_GLOBAL_CONFIG, CatbeeMonacoEditorGlobalConfig } from './monaco-editor.config';
import { CatbeeMonacoDiffEditorComponent } from './components/v1/monaco-editor-diff';

const components = [CatbeeMonacoEditorComponent, CatbeeMonacoDiffEditorComponent];

/** @ng-catbee: Monaco Editor Module
 * ```typescript
 * import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';
 * ```
 *
 * Or use `provideCatbeeMonacoEditor` to provide global configuration.
 * ```typescript
 * import { provideCatbeeMonacoEditor } from '@ng-catbee/monaco-editor';
 * ```
 */
@NgModule({
  imports: [CommonModule, ...components],
  exports: components
})
export class CatbeeMonacoEditorModule {
  /** Or use `provideCatbeeMonacoEditor` instead. from `@ng-catbee/monaco-editor` */
  static forRoot(config?: CatbeeMonacoEditorGlobalConfig): ModuleWithProviders<CatbeeMonacoEditorModule> {
    return {
      ngModule: CatbeeMonacoEditorModule,
      providers: [{ provide: CATBEE_MONACO_EDITOR_GLOBAL_CONFIG, useValue: config }]
    };
  }
}
