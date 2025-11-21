import { ChangeDetectionStrategy, Component, effect, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { CatbeeMonacoEditorBaseEditor } from '../shared/monaco-editor-base-editor';
import type { MonacoEditorOptions, MonacoModelContentChangedEvent } from '../../types/monaco-editor.types';

/** @ng-catbee: Monaco Editor Component - A powerful code editor component for Angular applications using Monaco Editor.
 *
 * ## Usage with Signal Forms
 * ```html
 * <ng-catbee-monaco-editor-v2
 *   [field]="myForm.code"
 *   [language]="'typescript'"
 *   [options]="{ theme: 'vs-dark' }"
 *   (init)="onInit($event)"
 * ></ng-catbee-monaco-editor-v2>
 * ```
 * Or use standalone:
 * ```html
 * <ng-catbee-monaco-editor-v2
 *   [(value)]="code"
 *   [language]="'typescript'"
 * ></ng-catbee-monaco-editor-v2>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-editor-v2',
  template: ``,
  exportAs: 'ngCatbeeMonacoEditorV2',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoEditorV2 extends CatbeeMonacoEditorBaseEditor implements FormValueControl<string> {
  /** The current editor value. */
  readonly value = model<string>('');
  /** Whether the user has interacted with the editor. */
  readonly touched = model<boolean>(false);

  /** Emitted when the content of the current model has changed. */
  override readonly editorModelContentChange = output<MonacoModelContentChangedEvent>();

  constructor() {
    super();
    effect(() => {
      const val = this.value();
      const editor = this._editor();
      if (!editor) return;

      if (editor.getValue() !== val) {
        editor.setValue(val);
        if (this.autoFormat()) {
          this.format();
        }
        this.updatePlaceholder();
      }
    });
  }

  protected getCurrentValue(): string {
    return this.value();
  }

  protected override initMonaco(options: MonacoEditorOptions, init: boolean): void {
    options = { ...this.config?.defaultOptions, ...options, readOnly: this.disabled() };

    const uri = this.uri();
    if (uri) {
      this.createOrGetModel(this.value(), options);
    }

    this._editor.set(monaco.editor.create(this.el.nativeElement, options));
    const editor = this._editor()!;

    editor.onDidChangeModelContent(e => {
      const newValue = editor.getValue();
      this.value.set(newValue);
      this.updatePlaceholder();
      this.editorModelContentChange.emit(e);
    });

    editor.onDidBlurEditorWidget(() => {
      this.touched.set(true);
    });

    this.registerEditorEvents(editor);
    this.updatePlaceholder();
    this.handleAutoFormat();
    this.emitInitEvent(init);
  }
}
