import { ChangeDetectionStrategy, Component, effect, forwardRef, input, model, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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
 * ## Usage
 * ```html
 * <ng-catbee-monaco-diff-editor
 *   [model]="{ original: 'old', modified: 'new' }"
 *   language="typescript"
 *   (editorDiffUpdate)="onDiffChange($event)"
 * ></ng-catbee-monaco-diff-editor>
 * ```
 *
 * Or use with ngModel:
 * ```html
 * <ng-catbee-monaco-diff-editor [(ngModel)]="diffValue" language="json"></ng-catbee-monaco-diff-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-diff-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoDiffEditor',
  host: {
    '[style.display]': `'block'`,
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[class.catbee-monaco-editor]': 'true'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatbeeMonacoDiffEditor),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoDiffEditor extends CatbeeMonacoEditorBase<MonacoDiffEditor> implements ControlValueAccessor {
  /** Combined diff model containing original and modified values. */
  readonly model = model<CatbeeMonacoDiffEditorModel>();

  /** Emitted when the diff information computed by this diff editor has been updated. */
  readonly diffUpdate = output<CatbeeMonacoDiffEditorEvent>();
  /** Single language used for both sides of the diff. */
  readonly language = input<string>('plaintext');

  /** Whether the original side is editable. */
  readonly originalEditable = input<boolean>(false);

  /** Fires when the diff content changes (on either side). */
  readonly editorDiffUpdate = output<CatbeeMonacoDiffEditorEvent>();

  /** Internal state using signals for better reactivity. */
  private readonly currentValue = signal<CatbeeMonacoDiffEditorModel>({ original: '', modified: '' });
  private onChange = (_: CatbeeMonacoDiffEditorModel) => {};
  private onTouched = () => {};

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
  }

  get editor(): MonacoDiffEditor | null | undefined {
    return this._editor();
  }

  /** Initialize the Monaco Diff Editor */
  protected initMonaco(options: MonacoDiffEditorOptions, init: boolean): void {
    options = {
      ...this.config?.defaultOptions,
      ...options,
      originalEditable: this.originalEditable()
    };

    const model = this.model();
    const language = this.language();
    const current = this.currentValue();

    const originalValue = model?.original ?? current.original ?? '';
    const modifiedValue = model?.modified ?? current.modified ?? '';

    const originalModel = monaco.editor.createModel(originalValue, language);
    const modifiedModel = monaco.editor.createModel(modifiedValue, language);

    this._editor.set(monaco.editor.createDiffEditor(this.el.nativeElement, options));
    const editor = this._editor()!;

    editor.setModel({ original: originalModel, modified: modifiedModel });

    // Listen for changes on both editors
    editor.getOriginalEditor().onDidChangeModelContent(() => {
      this.currentValue.update(v => ({ ...v, original: editor.getOriginalEditor().getValue() }));
      this.emitChange();
    });

    editor.getModifiedEditor().onDidChangeModelContent(() => {
      this.currentValue.update(v => ({ ...v, modified: editor.getModifiedEditor().getValue() }));
      this.emitChange();
    });

    editor.getModifiedEditor().onDidBlurEditorWidget(() => this.onTouched());

    editor.onDidUpdateDiff(() => {
      this.editorDiffUpdate.emit({ ...this.currentValue() });
    });

    this.registerResize();
    init ? this.init.emit(editor) : this.reInit.emit(editor);
  }

  /** ControlValueAccessor: write value */
  writeValue(value: CatbeeMonacoDiffEditorModel | null): void {
    if (!value) return;
    this.currentValue.set({ ...value });

    if (!this._editor()) return;

    this._editor()!
      .getOriginalEditor()
      ?.getModel()
      ?.setValue(value.original ?? '');
    this._editor()!
      .getModifiedEditor()
      ?.getModel()
      ?.setValue(value.modified ?? '');
  }

  /** ControlValueAccessor: register change handler */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /** ControlValueAccessor: register touch handler */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: set disabled state */
  setDisabledState(isDisabled: boolean): void {
    this._editor()?.updateOptions({ readOnly: isDisabled });
  }

  /** Emit change to both form and output */
  private emitChange(): void {
    const value = this.currentValue();
    this.onChange({ ...value });
    this.editorDiffUpdate.emit({ ...value });
  }
}

/**
 * @deprecated Use `CatbeeMonacoDiffEditor` instead.
 *
 * Old:
 * ```ts
 * import { CatbeeMonacoDiffEditorComponent } from '@ng-catbee/monaco-editor';
 * ```
 * New:
 * ```ts
 * import { CatbeeMonacoDiffEditor } from '@ng-catbee/monaco-editor';
 * ```
 *
 * This alias will be removed in a future release.
 */
export const CatbeeMonacoDiffEditorComponent = CatbeeMonacoDiffEditor;
