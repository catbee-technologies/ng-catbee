import { Component, effect, input, output } from '@angular/core';
import {
  MonacoDiffEditor,
  MonacoDiffEditorOptions,
  CatbeeMonacoDiffEditorEvent
} from '../../types/monaco-editor.types';
import { CatbeeMonacoEditorCommonBase } from './monaco-editor-base';

/** Common base class for Monaco Diff Editor (both V1 and V2). */
@Component({ selector: 'ng-catbee-monaco-diff-editor-base', template: `` })
export abstract class CatbeeMonacoDiffEditorBaseEditor extends CatbeeMonacoEditorCommonBase<MonacoDiffEditor> {
  /** Whether the original side is editable. */
  readonly originalEditable = input<boolean>(false);

  /** Emitted when the diff information computed by this diff editor has been updated. */
  readonly diffUpdate = output<CatbeeMonacoDiffEditorEvent>();
  /** Fires when the diff content changes (on either side). */
  readonly editorDiffUpdate = output<CatbeeMonacoDiffEditorEvent>();

  constructor() {
    super();

    effect(() => {
      const lang = this.language();
      if (!this._editor()) return;
      const originalModel = this._editor()!.getOriginalEditor().getModel();
      const modifiedModel = this._editor()!.getModifiedEditor().getModel();
      if (originalModel) monaco.editor.setModelLanguage(originalModel, lang);
      if (modifiedModel) monaco.editor.setModelLanguage(modifiedModel, lang);
    });

    effect(() => {
      const editable = this.originalEditable() && !this.disabledByFormControl();
      if (!this.editor) return;
      this.options.update(prev => ({ ...prev, originalEditable: editable }));
    });
  }

  get editor(): MonacoDiffEditor | null | undefined {
    return this._editor();
  }

  protected registerDiffEditorEvents(editor: MonacoDiffEditor): void {
    editor.onDidUpdateDiff(() => {
      this.diffUpdate.emit(this.getCurrentDiffValue());
    });
  }

  protected createDiffModels(
    originalValue: string,
    modifiedValue: string,
    language: string,
    options: MonacoDiffEditorOptions
  ): void {
    const originalModel = monaco.editor.createModel(originalValue, language);
    const modifiedModel = monaco.editor.createModel(modifiedValue, language);

    this._editor.set(monaco.editor.createDiffEditor(this.el.nativeElement, options));
    const editor = this._editor()!;

    editor.setModel({ original: originalModel, modified: modifiedModel });
  }

  protected abstract getCurrentDiffValue(): CatbeeMonacoDiffEditorEvent;
}
