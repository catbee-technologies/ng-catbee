import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  model,
  output,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { take, timer } from 'rxjs';
import { CatbeeMonacoEditorBase } from '../monaco-editor-base';
import { PlaceholderWidget } from '../../utils/placeholder.utils';
import {
  MonacoEditor,
  CatbeeMonacoEditorModel,
  MonacoEditorOptions,
  MonacoEditorScrollEvent,
  MonacoEditorCursorPositionChangedEvent,
  MonacoEditorCursorSelectionChangedEvent,
  MonacoEditorMouseEvent,
  MonacoEditorPasteEvent,
  MonacoEditorKeyboardEvent,
  MonacoEditorPartialMouseEvent,
  MonacoModelContentChangedEvent
} from '../../types/monaco-editor.types';

/** @ng-catbee: Monaco Editor Component - A powerful code editor component for Angular applications using Monaco Editor.
 *
 * ## Usage
 * ```html
 * <ng-catbee-monaco-editor
 *   [model]="{ value: code, language: 'typescript' }"
 *   [options]="{ theme: 'vs-dark' }"
 *   (init)="onInit($event)"
 * ></ng-catbee-monaco-editor>
 * ```
 * Or use with `ngModel`:
 * ```html
 * <ng-catbee-monaco-editor
 *   [(ngModel)]="code"
 *   [model]="{ language: 'typescript' }"
 * ></ng-catbee-monaco-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoEditor',
  host: {
    '[style.display]': `'block'`,
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[class.catbee-monaco-editor]': 'true'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatbeeMonacoEditor),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoEditor extends CatbeeMonacoEditorBase<MonacoEditor> implements ControlValueAccessor {
  /** The editor model. */
  readonly model = model<CatbeeMonacoEditorModel>();
  /** Whether to automatically format the document on save - default is `true`. */
  readonly autoFormat = input(true, { transform: booleanAttribute });
  /** The placeholder text to show when the editor is empty. */
  readonly placeholder = input<string | null>(null);
  /** The color of the placeholder text - default is `rgba(128, 128, 128, 0.6)`. */
  readonly placeholderColor = input<string>();
  /** Show placeholder when editor is empty but contains whitespace characters - default is `false`. */
  readonly showPlaceholderOnWhiteSpace = input(false, { transform: booleanAttribute });
  /** Emitted when the text inside this editor gained focus (i.e. cursor starts blinking). */
  readonly editorFocus = output<void>();
  /** Emitted when the text inside this editor lost focus (i.e. cursor stops blinking). */
  readonly editorBlur = output<void>();
  /** Emitted when the scroll in the editor has changed. */
  readonly editorScroll = output<MonacoEditorScrollEvent>();
  /** Emitted when the cursor position has changed. */
  readonly editorCursorPositionChange = output<MonacoEditorCursorPositionChangedEvent>();
  /** Emitted when the cursor selection has changed. */
  readonly editorCursorSelectionChange = output<MonacoEditorCursorSelectionChangedEvent>();
  /** Emitted when a context menu is triggered in the editor. */
  readonly editorContextMenu = output<MonacoEditorMouseEvent>();
  /** Emitted when a paste event occurs in the editor. */
  readonly editorPaste = output<MonacoEditorPasteEvent>();
  /** Emitted when a key is pressed down in the editor. */
  readonly editorKeyDown = output<MonacoEditorKeyboardEvent>();
  /** Emitted when a key is released in the editor. */
  readonly editorKeyUp = output<MonacoEditorKeyboardEvent>();
  /** Emitted when the mouse button is pressed down in the editor. */
  readonly editorMouseDown = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse button is released in the editor. */
  readonly editorMouseUp = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse is moved in the editor. */
  readonly editorMouseMove = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse leaves the editor. */
  readonly editorMouseLeave = output<MonacoEditorPartialMouseEvent>();
  /** Emitted when the content of the current model has changed. */
  readonly editorModelContentChange = output<MonacoModelContentChangedEvent>();

  private editorValue = '';
  private placeholderWidget?: PlaceholderWidget;

  constructor() {
    super();
    effect(() => {
      const placeholder = this.placeholder();
      this.placeholderWidget?.update(placeholder);
    });
    effect(() => {
      const model = this.model();
      if (!model) return;
      this.updateOptions(untracked(() => this.computedOptions()));
    });
  }

  /** Initialize the Monaco Editor instance with the provided options. */
  protected initMonaco(options: MonacoEditorOptions, init: boolean): void {
    const hasModel = !!this.model();
    options = { ...this.config?.defaultOptions, ...options };

    if (hasModel) {
      const model = monaco.editor.getModel(this.model()!.uri! || '');
      if (model) {
        options.model = model;
        options.model.setValue(this.editorValue);
      } else {
        const { value, language, uri } = this.model()!;
        options.model = monaco.editor.createModel(value || this.editorValue, language, uri);
      }
      this.editorValue = options.model.getValue();
    }

    const editor = (this._editor = monaco.editor.create(this.el.nativeElement, options));

    if (!hasModel) {
      editor.setValue(this.editorValue);
    }

    editor.onDidChangeModelContent(e => {
      const value = editor.getValue();
      this.editorValue = value;
      this.onChange(value);
      this.updatePlaceholder();
      this.editorModelContentChange.emit(e);
    });
    editor.onDidBlurEditorWidget(() => this.onTouched());

    editor.onDidBlurEditorText(() => this.editorBlur.emit());
    editor.onDidFocusEditorText(() => this.editorFocus.emit());
    editor.onDidChangeCursorPosition(e => this.editorCursorPositionChange.emit(e));
    editor.onDidChangeCursorSelection(e => this.editorCursorSelectionChange.emit(e));
    editor.onContextMenu(e => this.editorContextMenu.emit(e));
    editor.onDidScrollChange(e => this.editorScroll.emit(e));
    editor.onDidPaste(e => this.editorPaste.emit(e));
    editor.onKeyDown(e => this.editorKeyDown.emit(e));
    editor.onKeyUp(e => this.editorKeyUp.emit(e));
    editor.onMouseDown(e => this.editorMouseDown.emit(e));
    editor.onMouseUp(e => this.editorMouseUp.emit(e));
    editor.onMouseMove(e => this.editorMouseMove.emit(e));
    editor.onMouseLeave(e => this.editorMouseLeave.emit(e));

    this.updatePlaceholder();
    this.registerResize();

    if (this.autoFormat()) {
      timer(this._config.autoFormatTime!)
        .pipe(takeUntilDestroyed(this.destroy$), take(1))
        .subscribe(() => this.format()?.then(() => this.emitInitEvent(init)));
      return;
    }
    this.emitInitEvent(init);
  }

  /** Used by the ControlValueAccessor */
  private onChange = (_: string) => {};
  /** Used by the ControlValueAccessor */
  private onTouched = () => {};

  /** Used by the ControlValueAccessor */
  writeValue(value: string): void {
    this.editorValue = value || '';
    this._editor?.setValue(this.editorValue);
    if (this.autoFormat()) {
      this.format();
    }
  }

  /** Used by the ControlValueAccessor */
  registerOnChange(fn: (_: string) => void): void {
    this.onChange = fn;
  }

  /** Used by the ControlValueAccessor */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /** Used by the ControlValueAccessor */
  setDisabledState(isDisabled: boolean): void {
    this.updateOptions({ ...this.computedOptions(), readOnly: isDisabled, domReadOnly: isDisabled });
  }

  get editor(): MonacoEditor | null | undefined {
    return this._editor;
  }

  private emitInitEvent(init: boolean) {
    init ? this.init.emit(this._editor!) : this.reInit.emit(this._editor!);
  }

  private async format(): Promise<void | null> {
    const action = this.editor?.getAction('editor.action.formatDocument');
    if (!action) return null;
    return action.run();
  }

  private updatePlaceholder() {
    const placeholder = this.placeholder();
    const editor = this.editor;
    const value = this.editorValue ?? '';

    if (!placeholder || !editor) return;

    if (!this.placeholderWidget) {
      this.placeholderWidget = new PlaceholderWidget(editor, placeholder, this.placeholderColor());
    }

    const trimmed = value.trim();
    const shouldShow = value.length === 0 || (trimmed.length === 0 && this.showPlaceholderOnWhiteSpace());

    const alreadyAttached = (editor as any)?._contentWidgets?.[this.placeholderWidget.getId()];

    if (shouldShow && !alreadyAttached) {
      editor.addContentWidget(this.placeholderWidget);
    } else if (!shouldShow && alreadyAttached) {
      editor.removeContentWidget(this.placeholderWidget);
    }
  }
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
 * This alias will be removed in a future release.
 */
export const CatbeeMonacoEditorComponent = CatbeeMonacoEditor;
