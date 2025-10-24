import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { Monaco, MonacoEditorOptions } from './types/monaco-editor.types';

export const CATBEE_MONACO_EDITOR_GLOBAL_CONFIG = new InjectionToken<CatbeeMonacoEditorGlobalConfig>(
  'CATBEE_MONACO_EDITOR_CONFIG'
);

/**
 * Provide global configuration for Catbee Monaco Editor.
 * ```typescript
 * import { provideCatbeeMonacoEditor } from '@ng-catbee/monaco-editor';
 * @NgModule({
 *   providers: [
 *     provideCatbeeMonacoEditor({
 *       baseUrl: 'assets/monaco-editor/',
 *       defaultOptions: {
 *         theme: 'vs-dark',
 *         language: 'typescript'
 *       }
 *     })
 *   ]
 * })
 */
export function provideCatbeeMonacoEditor(config?: CatbeeMonacoEditorGlobalConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CATBEE_MONACO_EDITOR_GLOBAL_CONFIG, useValue: config }]);
}

export interface CatbeeMonacoEditorGlobalConfig {
  /**
   * The base URL to monaco editor library assets via AMD (RequireJS), Default: `https://cdn.jsdelivr.net/npm/monaco-editor/min`
   * You can use local path, e.g.: `assets/monaco-editor/min/`.
   * Make sure the path you set contains the `/vs` folder, e.g.: `assets/monaco-editor/vs`
   */
  baseUrl?: string;

  /** The default options for all monaco editor instances. */
  defaultOptions?: MonacoEditorOptions;

  /**
   * The event after the monaco editor library is loaded.
   * Use this function to customize monaco instance. E.g.: defineTheme, setCompilerOptions, addExtraLib, etc.
   *
   * Example 1: Define a custom theme
   * ```ts
   * monacoLoad: (monaco) => {
   *   monaco.editor.defineTheme('myTheme', {
   *     base: 'vs',
   *     inherit: true,
   *     rules: [
   *       { background: 'FFFFFF', foreground: '000000', fontStyle: 'bold' }
   *     ],
   *     colors: {
   *       'editor.background': '#FFFFFF',
   *       'editor.foreground': '#000000'
   *     }
   *   });
   * }
   * ```
   * Example 2: Set TypeScript compiler options
   * ```ts
   * monacoLoad: (monaco) => {
   *   monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
   *     ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
   *     noLib: true,
   *     allowNonTsExtensions: true
   *   });
   * }
   * ```
   * Example 3: Add extra library for TypeScript
   * ```ts
   * monacoLoad: (monaco) => {
   *   monaco.languages.typescript.typescriptDefaults.addExtraLib(
   *     'declare function myCustomFunction(): void;',
   *     'file:///my-custom-lib.d.ts'
   *   );
   * }
   * ```
   * @param monaco The monaco editor instance.
   */
  monacoLoad?: (_monaco: Monaco) => void;

  /**
   * The event before the monaco editor library is loaded.
   * Use this function to perform any actions before monaco is loaded.
   */
  monacoPreLoad?: () => void;

  /** Auto format the document after model is set, in milliseconds - default: `100` */
  autoFormatTime?: number;

  /** Debounce time for editor resize events, in milliseconds - default: `100` */
  resizeDebounceTime?: number;
}
