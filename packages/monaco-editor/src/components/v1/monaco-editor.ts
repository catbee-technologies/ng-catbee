import { ChangeDetectionStrategy, Component, effect, forwardRef, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CatbeeMonacoEditorBaseEditor } from '../shared/monaco-editor-base-editor';
import type { MonacoEditorOptions } from '../../types/monaco-editor.types';

/** @ng-catbee: Monaco Editor Component - A powerful code editor component for Angular applications using Monaco Editor.
 *
 * ## Usage
 * ```html
 * <ng-catbee-monaco-editor
 *   [(value)]="code"
 *   [language]="'typescript'"
 *   [options]="{ theme: 'vs-dark' }"
 *   (init)="onInit($event)"
 * ></ng-catbee-monaco-editor>
 * ```
 * Or use with `ngModel`:
 * ```html
 * <ng-catbee-monaco-editor
 *   [(ngModel)]="code"
 *   [language]="'typescript'"
 * ></ng-catbee-monaco-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoEditor',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatbeeMonacoEditor),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoEditor extends CatbeeMonacoEditorBaseEditor implements ControlValueAccessor {
  /** The editor value. */
  readonly value = model<string>('');

  constructor() {
    super();

    // Update placeholder when value changes
    effect(() => {
      this.value();
      this.updatePlaceholder();
    });
  }

  protected getCurrentValue(): string {
    return this.value();
  }

  protected override initMonaco(options: MonacoEditorOptions, init: boolean): void {
    options = { ...this.config?.defaultOptions, ...options };

    const uri = this.uri();
    if (uri) {
      this.createOrGetModel(this.value(), options);
    }

    this._editor.set(monaco.editor.create(this.el.nativeElement, options));
    const editor = this._editor()!;
    editor.setValue(this.value());

    editor.onDidChangeModelContent(e => {
      const value = editor.getValue();
      this.value.set(value);
      this.onChange(value);
      this.editorModelContentChange.emit(e);
    });
    editor.onDidBlurEditorWidget(() => this.onTouched());

    this.registerEditorEvents(editor);
    this.updatePlaceholder();
    this.handleAutoFormat();
    this.emitInitEvent(init);
  }

  /** Used by the ControlValueAccessor */
  /* eslint-disable @typescript-eslint/no-empty-function */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private onChange = (_: string) => {};
  private onTouched = () => {};
  writeValue(value: string): void {
    this.value.set(value || '');
    this._editor()?.setValue(this.value());
    if (this.autoFormat()) {
      this.format();
    }
  }
  registerOnChange(fn: (_: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledByFormControl.set(isDisabled);
    this.options.update(prev => ({ ...prev, readOnly: isDisabled, domReadOnly: isDisabled }));
  }
  /* eslint-enable @typescript-eslint/no-empty-function */
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * @deprecated Use `CatbeeMonacoEditor` instead.
 *
 * Old:
 * ```ts
 * import { CatbeeMonacoEditorComponent } from '@ng-catbee/monaco-editor';
 * ```
 * New:
 * ```ts
 * import { CatbeeMonacoEditor } from '@ng-catbee/monaco-editor';
 * ```
 *
 * This alias will be removed in v22.0.0.
 */
export const CatbeeMonacoEditorComponent = CatbeeMonacoEditor;
