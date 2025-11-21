import { ChangeDetectionStrategy, Component, effect, input, model, output } from '@angular/core';
import type { DisabledReason, FormValueControl, ValidationError, WithOptionalField } from '@angular/forms/signals';
import { CatbeeMonacoEditorBase } from '../monaco-editor-base';
import type {
  MonacoDiffEditor,
  MonacoDiffEditorOptions,
  CatbeeMonacoDiffEditorModel,
  CatbeeMonacoDiffEditorEvent
} from '../../types/monaco-editor.types';

/**
 * @ng-catbee: Monaco Diff Editor Component - A side-by-side code comparison editor.
 *
 * ## Usage with Signal Forms
 * ```html
 * <ng-catbee-monaco-diff-editor
 *   [field]="myForm.diffField"
 *   language="typescript"
 *   (editorDiffUpdate)="onDiffChange($event)"
 * ></ng-catbee-monaco-diff-editor>
 * ```
 *
 * Or use standalone:
 * ```html
 * <ng-catbee-monaco-diff-editor
 *   [(value)]="diffValue"
 *   language="json"
 * ></ng-catbee-monaco-diff-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-diff-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoDiffEditorV2',
  host: {
    '[style.display]': `'block'`,
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[class.catbee-monaco-editor]': 'true'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoDiffEditorV2
  extends CatbeeMonacoEditorBase<MonacoDiffEditor>
  implements FormValueControl<CatbeeMonacoDiffEditorModel>
{
  // Required: FormValueControl interface
  /** The current diff value containing original and modified content. */
  readonly value = model<CatbeeMonacoDiffEditorModel>({ original: '', modified: '' });

  // Optional: Form state properties
  /** Whether the user has interacted with the editor. */
  readonly touched = model<boolean>(false);

  /** Whether the field is disabled. */
  override readonly disabled = input<boolean>(false);

  /** Disabled reasons from the form. */
  readonly disabledReasons = input<readonly WithOptionalField<DisabledReason>[]>([]);

  /** Whether the field is readonly. */
  readonly readonly = input<boolean>(false);

  /** Whether the field is hidden. */
  readonly hidden = input<boolean>(false);

  /** Validation errors from the form. */
  readonly errors = input<readonly WithOptionalField<ValidationError>[]>([]);

  /** Whether the field is invalid. */
  readonly invalid = input<boolean>(false);

  /** Whether the field is valid. */
  readonly valid = input<boolean>(false);

  /** Whether async validation is in progress. */
  readonly pending = input<boolean>(false);

  /** Whether the field is required. */
  readonly required = input<boolean>(false);

  /** Field name attribute. */
  readonly name = input<string>('');

  // Component-specific properties
  /** Emitted when the diff information computed by this diff editor has been updated. */
  readonly diffUpdate = output<CatbeeMonacoDiffEditorEvent>();
  /** Single language used for both sides of the diff. */
  readonly language = input<string>('plaintext');

  /** Whether the original side is editable. */
  readonly originalEditable = input<boolean>(false);

  /** Fires when the diff content changes (on either side). */
  readonly editorDiffUpdate = output<CatbeeMonacoDiffEditorEvent>();

  constructor() {
    super();

    // React to language changes
    effect(() => {
      const lang = this.language();
      if (!this._editor()) return;
      const originalModel = this._editor()!.getOriginalEditor().getModel();
      const modifiedModel = this._editor()!.getModifiedEditor().getModel();
      if (originalModel) monaco.editor.setModelLanguage(originalModel, lang);
      if (modifiedModel) monaco.editor.setModelLanguage(modifiedModel, lang);
    });

    effect(() => {
      const editable = this.originalEditable();
      if (!this.editor) return;
      this.editor.updateOptions({ ...this.computedOptions(), originalEditable: editable });
    });

    // React to value changes from the form
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

  get editor(): MonacoDiffEditor | null | undefined {
    return this._editor();
  }

  /** Initialize the Monaco Diff Editor */
  protected initMonaco(options: MonacoDiffEditorOptions, init: boolean): void {
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

    const originalModel = monaco.editor.createModel(originalValue, language);
    const modifiedModel = monaco.editor.createModel(modifiedValue, language);

    this._editor.set(monaco.editor.createDiffEditor(this.el.nativeElement, options));
    const editor = this._editor()!;

    editor.setModel({ original: originalModel, modified: modifiedModel });

    // Listen for changes on both editors
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

    editor.onDidUpdateDiff(() => {
      this.diffUpdate.emit({ ...this.value() });
    });

    this.registerResize();
    init ? this.init.emit(editor) : this.reInit.emit(editor);
  }
}
