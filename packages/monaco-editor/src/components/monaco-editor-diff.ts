import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CatbeeMonacoEditorBase } from './monaco-editor-base';
import {
  MonacoDiffEditor,
  CatbeeMonacoDiffEditorModel,
  MonacoEditorOptions,
  MonacoDiffEditorOptions,
  CatbeeMonacoDiffEditorEvent
} from '../types/monaco-editor.types';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoDiffEditorComponent extends CatbeeMonacoEditorBase<MonacoDiffEditor> {
  /** The original model to compare. */
  readonly original = input.required<CatbeeMonacoDiffEditorModel>();
  /** The modified model to compare against the original. */
  readonly modified = input.required<CatbeeMonacoDiffEditorModel>();
  /** Whether the original editor is editable. - default is `false`. */
  readonly originalEditable = input(false, { transform: booleanAttribute });

  /** Emitted when the diff information computed by this diff editor has been updated. */
  readonly editorDiffUpdate = output<CatbeeMonacoDiffEditorEvent>();

  get editor(): MonacoDiffEditor | null | undefined {
    return this._editor;
  }

  /**
   * Initialize the Monaco Diff Editor instance.
   * @param _options - Not used - diff options are computed internally
   * @param init - Whether this is the initial initialization or a re-initialization.
   */
  protected initMonaco(options: MonacoDiffEditorOptions, init: boolean): void {
    options = { ...this.config?.defaultOptions, ...options, originalEditable: this.originalEditable() };

    const originalModel = this.original();
    const modifiedModel = this.modified();

    const editor = (this._editor = monaco.editor.createDiffEditor(this.el.nativeElement, options));
    editor.setModel({
      original: monaco.editor.createModel(
        this.original().value,
        originalModel?.language || (options as MonacoEditorOptions)?.language
      ),
      modified: monaco.editor.createModel(
        this.modified().value,
        modifiedModel?.language || (options as MonacoEditorOptions)?.language
      )
    });

    editor.onDidUpdateDiff(() => {
      this.editorDiffUpdate.emit({
        original: editor.getOriginalEditor().getValue(),
        modified: editor.getModifiedEditor().getValue()
      });
    });

    this.registerResize();
    if (init) {
      this.init.emit(this._editor);
    } else {
      this.reInit.emit(this._editor);
    }
  }
}
