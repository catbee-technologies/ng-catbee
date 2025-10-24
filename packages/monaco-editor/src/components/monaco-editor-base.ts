import { DOCUMENT, isPlatformServer } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  OnDestroy,
  output,
  PLATFORM_ID
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MonacoDiffEditor, MonacoEditor, MonacoEditorOptions } from '../types/monaco-editor.types';
import { CATBEE_MONACO_EDITOR_GLOBAL_CONFIG, CatbeeMonacoEditorGlobalConfig } from '../monaco-editor.config';

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({ selector: 'ng-catbee-monaco-base', template: `` })
export abstract class CatbeeMonacoEditorBase<T extends MonacoEditor | MonacoDiffEditor>
  implements AfterViewInit, OnDestroy
{
  protected readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly config = inject(CATBEE_MONACO_EDITOR_GLOBAL_CONFIG, { optional: true });
  protected readonly doc = inject(DOCUMENT);
  protected readonly destroy$ = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  private previousLanguage: string | undefined;

  protected _editor?: T;
  protected _resize$: Subscription | null = null;
  protected _config: CatbeeMonacoEditorGlobalConfig;

  /** The height of the editor. - default is `300px`. */
  readonly height = input('300px');
  /** The width of the editor. - default is `100%`. */
  readonly width = input('100%');
  /** The delay in milliseconds before initializing the editor. - default is `0`. */
  readonly initDelay = input(0, { transform: numberAttribute });
  /** Whether the editor is disabled (read-only). - default is `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The options for the editor instance. */
  readonly options = input<MonacoEditorOptions>();
  /**
   * Whether to re-initialize the editor instance when options change. - default is `false`.
   * If set to `true`, the editor will be fully re-initialized on options change.
   * If set to `false`, only the options will be updated.
   * By default, the editor will re-initialize only if the language option changes.
   * Note: Some options (like language) may require re-initialization to take effect.
   */
  readonly reInitOnOptionsChange = input(false, { transform: booleanAttribute });

  /** Emitted when the editor is initialized. */
  readonly init = output<T>();
  /** Emitted when the editor is re-initialized. */
  readonly reInit = output<T>();
  /** Emitted when the editor initialization fails. */
  readonly initError = output<unknown>();
  /** Emitted when the editor is resized. */
  readonly resize = output<T>();
  /** Emitted when the editor options are changed. */
  readonly optionsChange = output<MonacoEditorOptions>();

  readonly computedOptions = computed<MonacoEditorOptions>(() => {
    return { ...this.options(), readOnly: this.disabled(), domReadOnly: this.disabled() };
  });

  constructor() {
    this._config = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor/min', autoFormatTime: 100, resizeDebounceTime: 100, ...this.config };
    effect(() => this.updateOptions(this.computedOptions()));
  }

  ngAfterViewInit(): void {
    this.previousLanguage = this.computedOptions()?.language;
    setTimeout(() => this.initEditor(), +this.initDelay());
  }

  updateOptions(v: MonacoEditorOptions | undefined): void {
    if (!this._editor || !v) return;
    if (this.reInitOnOptionsChange()) {
      this.reInitMonaco(v);
    } else {
      if (this.previousLanguage != v.language) {
        this.reInitMonaco(v);
      } else {
        this._editor?.updateOptions(v);
      }
    }
    this.previousLanguage = v.language;
    this.optionsChange.emit(v);
  }

  protected abstract initMonaco(options: MonacoEditorOptions | undefined, init: boolean): void;

  private initEditor(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    if (loadedMonaco) {
      loadPromise.then(() => {
        this.initMonaco(this.computedOptions(), true);
      });
      return;
    }

    loadedMonaco = true;
    loadPromise = new Promise<void>((resolve: () => void, reject: (err: string) => void) => {
      if (this.doc?.defaultView == null) {
        resolve();
        return;
      }

      const win = this.doc.defaultView as any;
      if (win.monaco) {
        resolve();
        return;
      }

      let baseUrl = `${this._config.baseUrl}/vs`;
      if (!/^https?:\/\//g.test(baseUrl)) {
        baseUrl = `${window.location.origin}/${baseUrl.startsWith('/') ? baseUrl.substring(1) : baseUrl}`;
      }

      const amdLoader = () => {
        win.require.config({
          paths: {
            vs: baseUrl
          }
        });
        if (typeof this._config.monacoPreLoad === 'function') {
          this._config.monacoPreLoad();
        }
        win.require(
          ['vs/editor/editor.main'],
          () => {
            if (typeof this._config.monacoLoad === 'function') {
              this._config.monacoLoad(win.monaco);
            }
            this.initMonaco(this.computedOptions(), true);
            resolve();
          },
          () => {
            reject(`Unable to load editor/editor.main module, please check your network environment.`);
          }
        );
      };

      if (!win.require) {
        const loaderScript = this.doc.createElement('script') as HTMLScriptElement;
        loaderScript.type = 'text/javascript';
        loaderScript.src = `${baseUrl}/loader.js`;
        loaderScript.onload = amdLoader;
        loaderScript.onerror = () =>
          reject(`Unable to load ${loaderScript.src}, please check your network environment.`);
        this.doc.getElementsByTagName('head')[0].appendChild(loaderScript);
      } else {
        amdLoader();
      }
    }).catch(error => {
      console.error('Monaco Editor init error:', error);
      this.initError.emit(error);
    });
  }

  protected registerResize(): this {
    this.cleanResize();
    this._resize$ = fromEvent(window, 'resize')
      .pipe(debounceTime(this._config.resizeDebounceTime ?? 100))
      .subscribe(() => {
        this._editor?.layout();
        this.resize.emit(this._editor as T);
      });
    return this;
  }

  protected cleanResize(): this {
    this._resize$?.unsubscribe();
    return this;
  }

  reInitMonaco(options: MonacoEditorOptions | undefined): void {
    this._editor!.dispose();
    this.initMonaco(options, false);
    this.reInit.emit(this._editor as T);
  }

  ngOnDestroy(): void {
    this.cleanResize();
    this._editor?.dispose();
  }
}
