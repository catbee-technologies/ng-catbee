import { Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, take, timer } from 'rxjs';
import { CatbeeMonacoEditorCommonBase } from './monaco-editor-base';
import { PlaceholderWidget } from '../../utils/placeholder.utils';
import type {
  MonacoEditor,
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

/** Common base class for Monaco Editor (both V1 and V2). */
@Component({ selector: 'ng-catbee-monaco-editor-base', template: `` })
export abstract class CatbeeMonacoEditorBaseEditor extends CatbeeMonacoEditorCommonBase<MonacoEditor> {
  /** The URI of the editor model. */
  readonly uri = input<monaco.Uri | string | undefined>();
  /** Whether to automatically format the document on save - default is `true`. */
  readonly autoFormat = input<boolean>(true);
  /** The placeholder text to show when the editor is empty. */
  readonly placeholder = input<string | null>(null);
  /** The color of the placeholder text - default is `rgba(128, 128, 128, 0.6)`. */
  readonly placeholderColor = input<string>();
  /** Show placeholder when editor is empty but contains whitespace characters - default is `false`. */
  readonly showPlaceholderOnWhiteSpace = input<boolean>(false);

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

  protected placeholderWidget?: PlaceholderWidget;
  private autoFormatSubscription: Subscription | undefined;

  constructor() {
    super();

    // Update placeholder when placeholder text changes
    effect(() => {
      const placeholder = this.placeholder();
      this.placeholderWidget?.update(placeholder);
    });

    effect(() => {
      const lang = this.language();
      if (!this._editor()) return;
      const model = this._editor()!.getModel();
      if (model) monaco.editor.setModelLanguage(model, lang);
    });
  }

  /**
   * Gets the Monaco editor instance.
   */
  get editor(): MonacoEditor | null | undefined {
    return this._editor();
  }

  /**
   * Abstract method to get the current editor value.
   * Must be implemented by subclasses (V1 and V2).
   */
  protected abstract getCurrentValue(): string;

  /**
   * Creates or retrieves a Monaco model for the editor.
   * @param currentValue - The current value to set in the model
   * @param options - Monaco editor options to update
   */
  protected createOrGetModel(currentValue: string, options: MonacoEditorOptions): void {
    const uri = this.uri();
    if (!uri) return;

    const parsedUri = typeof uri === 'string' ? monaco.Uri.parse(uri) : uri;
    const existingModel = monaco.editor.getModel(parsedUri);

    if (existingModel) {
      if (existingModel.getValue() !== currentValue) {
        existingModel.setValue(currentValue);
      }
      options.model = existingModel;
    } else {
      options.model = monaco.editor.createModel(currentValue, this.language(), parsedUri);
    }
  }

  /**
   * Registers common Monaco editor event handlers.
   * @param editor - The Monaco editor instance
   */
  protected registerEditorEvents(editor: MonacoEditor): void {
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
  }

  /**
   * Handles auto-formatting if enabled, then emits init event.
   * @param init - Whether this is the initial initialization
   */
  protected handleAutoFormat(): void {
    this.autoFormatSubscription?.unsubscribe();
    if (this.autoFormat()) {
      this.autoFormatSubscription = timer(this._config().autoFormatTime!)
        .pipe(takeUntilDestroyed(this.destroy$), take(1))
        .subscribe(() => this.format());
    }
  }

  /** Formats the document using Monaco's format action. */
  protected async format(): Promise<void | null> {
    const action = this.editor?.getAction('editor.action.formatDocument');
    if (!action) return null;
    return action.run();
  }

  /** Updates the placeholder widget based on current value and configuration. */
  protected updatePlaceholder(): void {
    const placeholder = this.placeholder();
    const editor = this.editor;
    const currentValue = this.getCurrentValue();

    if (!placeholder || !editor) return;

    if (!this.placeholderWidget) {
      this.placeholderWidget = new PlaceholderWidget(editor, placeholder, this.placeholderColor());
    }

    const trimmed = currentValue.trim();
    const shouldShow = currentValue.length === 0 || (trimmed.length === 0 && this.showPlaceholderOnWhiteSpace());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alreadyAttached = (editor as any)?._contentWidgets?.[this.placeholderWidget.getId()];

    if (shouldShow && !alreadyAttached) {
      editor.addContentWidget(this.placeholderWidget);
    } else if (!shouldShow && alreadyAttached) {
      editor.removeContentWidget(this.placeholderWidget);
    }
  }
}
