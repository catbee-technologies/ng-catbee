import { ChangeDetectionStrategy, Component, effect, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { CatbeeMonacoDiffEditorBaseEditor } from '../shared/monaco-editor-base-diff-editor';
import type {
  MonacoDiffEditorOptions,
  CatbeeMonacoDiffEditorModel,
  CatbeeMonacoDiffEditorEvent
} from '../../types/monaco-editor.types';

/**
 * @ng-catbee: Monaco Diff Editor Component - A side-by-side code comparison editor.
 *
 * ## Usage with Signal Forms
 * ```html
 * <ng-catbee-monaco-diff-editor-v2
 *   [field]="myForm.diffField"
 *   [language]="'typescript'"
 *   (editorDiffUpdate)="onDiffChange($event)"
 * ></ng-catbee-monaco-diff-editor-v2>
 * ```
 *
 * Or use standalone:
 * ```html
 * <ng-catbee-monaco-diff-editor-v2
 *   [(value)]="diffValue"
 *   [language]="'json'"
 * ></ng-catbee-monaco-diff-editor-v2>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-diff-editor-v2',
  template: ``,
  exportAs: 'ngCatbeeMonacoDiffEditorV2',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoDiffEditorV2
  extends CatbeeMonacoDiffEditorBaseEditor
  implements FormValueControl<CatbeeMonacoDiffEditorModel>
{
  /** The current diff value containing original and modified content. */
  readonly value = model<CatbeeMonacoDiffEditorModel>({ original: '', modified: '' });
  /** Whether the user has interacted with the editor. */
  readonly touched = model<boolean>(false);
  /** Emitted when the diff information computed by this diff editor has been updated. */
  override readonly diffUpdate = output<CatbeeMonacoDiffEditorEvent>();
  /** Fires when the diff content changes (on either side). */
  override readonly editorDiffUpdate = output<CatbeeMonacoDiffEditorEvent>();

  constructor() {
    super();

    effect(() => {
      const val = this.value();
      if (!this._editor()) return;

      const originalModel = this._editor()!.getOriginalEditor().getModel();
      const modifiedModel = this._editor()!.getModifiedEditor().getModel();

      if (originalModel && originalModel.getValue() !== val.original) {
        originalModel.setValue(val.original ?? '');
      }
      if (modifiedModel && modifiedModel.getValue() !== val.modified) {
        modifiedModel.setValue(val.modified ?? '');
      }
    });
  }

  protected getCurrentDiffValue(): CatbeeMonacoDiffEditorEvent {
    return { ...this.value() };
  }

  protected override initMonaco(options: MonacoDiffEditorOptions, init: boolean): void {
    options = {
      ...this.config?.defaultOptions,
      ...options,
      originalEditable: this.originalEditable(),
      readOnly: this.disabled()
    };

    const currentValue = this.value();
    const language = this.language();

    const originalValue = currentValue?.original ?? '';
    const modifiedValue = currentValue?.modified ?? '';

    this.createDiffModels(originalValue, modifiedValue, language, options);
    const editor = this._editor()!;

    editor.getOriginalEditor().onDidChangeModelContent(() => {
      const newValue: CatbeeMonacoDiffEditorModel = {
        original: editor.getOriginalEditor().getValue(),
        modified: editor.getModifiedEditor().getValue()
      };
      this.value.set(newValue);
      this.editorDiffUpdate.emit(newValue);
    });

    editor.getModifiedEditor().onDidChangeModelContent(() => {
      const newValue: CatbeeMonacoDiffEditorModel = {
        original: editor.getOriginalEditor().getValue(),
        modified: editor.getModifiedEditor().getValue()
      };
      this.value.set(newValue);
      this.editorDiffUpdate.emit(newValue);
    });

    editor.getModifiedEditor().onDidBlurEditorWidget(() => {
      this.touched.set(true);
    });

    this.registerDiffEditorEvents(editor);
    this.emitInitEvent(init);
  }
}
