import { ChangeDetectionStrategy, Component, forwardRef, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CatbeeMonacoDiffEditorBaseEditor } from '../shared/monaco-editor-base-diff-editor';
import type {
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
 *   [(value)]="{ original: 'old', modified: 'new' }"
 *   [language]="'typescript'"
 *   (editorDiffUpdate)="onDiffChange($event)"
 * ></ng-catbee-monaco-diff-editor>
 * ```
 *
 * Or use with ngModel:
 * ```html
 * <ng-catbee-monaco-diff-editor
 *   [(ngModel)]="diffValue"
 *   [language]="'json'"
 *   (editorDiffUpdate)="onDiffChange($event)"
 * ></ng-catbee-monaco-diff-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-diff-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoDiffEditor',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatbeeMonacoDiffEditor),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoDiffEditor extends CatbeeMonacoDiffEditorBaseEditor implements ControlValueAccessor {
  /** Combined diff model containing original and modified values. */
  readonly model = model<CatbeeMonacoDiffEditorModel>();

  /** Internal state using signals for better reactivity. */
  private readonly currentValue = signal<CatbeeMonacoDiffEditorModel>({ original: '', modified: '' });

  constructor() {
    super();
  }

  protected getCurrentDiffValue(): CatbeeMonacoDiffEditorEvent {
    return { ...this.currentValue() };
  }

  protected override initMonaco(options: MonacoDiffEditorOptions, init: boolean): void {
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

    this.createDiffModels(originalValue, modifiedValue, language, options);
    const editor = this._editor()!;

    editor.getOriginalEditor().onDidChangeModelContent(() => {
      this.currentValue.update(v => ({ ...v, original: editor.getOriginalEditor().getValue() }));
      this.emitChange();
    });

    editor.getModifiedEditor().onDidChangeModelContent(() => {
      this.currentValue.update(v => ({ ...v, modified: editor.getModifiedEditor().getValue() }));
      this.emitChange();
    });

    editor.getModifiedEditor().onDidBlurEditorWidget(() => this.onTouched());

    this.registerDiffEditorEvents(editor);
    this.emitInitEvent(init);
  }

  /** Emit change to both form and output */
  private emitChange(): void {
    const value = this.currentValue();
    this.onChange({ ...value });
    this.editorDiffUpdate.emit({ ...value });
  }

  /** Used by the ControlValueAccessor */
  /* eslint-disable @typescript-eslint/no-empty-function */
  private onChange = (_: CatbeeMonacoDiffEditorModel) => {};
  private onTouched = () => {};
  /* eslint-enable @typescript-eslint/no-empty-function */
  writeValue(value: CatbeeMonacoDiffEditorModel | null): void {
    if (!value) return;
    this.currentValue.set({ ...value });

    if (!this._editor()) return;

    const originalModel = this._editor()!.getOriginalEditor().getModel();
    const modifiedModel = this._editor()!.getModifiedEditor().getModel();
    originalModel?.setValue(value.original ?? '');
    modifiedModel?.setValue(value.modified ?? '');
  }
  registerOnChange(fn: unknown): void {
    this.onChange = fn as (_: CatbeeMonacoDiffEditorModel) => void;
  }
  registerOnTouched(fn: unknown): void {
    this.onTouched = fn as () => void;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledByFormControl.set(isDisabled);
    this.options.update(prev => ({
      ...prev,
      readOnly: isDisabled,
      domReadOnly: isDisabled,
      originalEditable: this.originalEditable()
    }));
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
 * This alias will be removed in v22.0.0.
 */
export const CatbeeMonacoDiffEditorComponent = CatbeeMonacoDiffEditor;
