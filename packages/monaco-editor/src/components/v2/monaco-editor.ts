import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { DisabledReason, FormValueControl, ValidationError, WithOptionalField } from '@angular/forms/signals';
import { take, timer } from 'rxjs';
import { CatbeeMonacoEditorBase } from '../monaco-editor-base';
import { PlaceholderWidget } from '../../utils/placeholder.utils';
import type {
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
 * ## Usage with Signal Forms
 * ```html
 * <ng-catbee-monaco-editor
 *   [field]="myForm.code"
 *   [model]="{ language: 'typescript' }"
 *   [options]="{ theme: 'vs-dark' }"
 *   (init)="onInit($event)"
 * ></ng-catbee-monaco-editor>
 * ```
 * Or use standalone:
 * ```html
 * <ng-catbee-monaco-editor
 *   [(value)]="code"
 *   [model]="{ language: 'typescript' }"
 * ></ng-catbee-monaco-editor>
 * ```
 */
@Component({
  selector: 'ng-catbee-monaco-editor',
  template: ``,
  exportAs: 'ngCatbeeMonacoEditorV2',
  host: {
    '[style.display]': `'block'`,
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[class.catbee-monaco-editor]': 'true'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoEditorV2 extends CatbeeMonacoEditorBase<MonacoEditor> implements FormValueControl<string> {
  // Required: FormValueControl interface
  /** The current editor value. */
  readonly value = model<string>('');

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
  /** The editor model configuration. */
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

    // React to value changes from the form
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

  /** Initialize the Monaco Editor instance with the provided options. */
  protected initMonaco(options: MonacoEditorOptions, init: boolean): void {
    const hasModel = !!this.model();
    options = { ...this.config?.defaultOptions, ...options, readOnly: this.disabled() };

    const currentValue = this.value();

    if (hasModel) {
      const model = monaco.editor.getModel(this.model()!.uri! || '');
      if (model) {
        options.model = model;
        options.model.setValue(currentValue);
      } else {
        const { value, language, uri } = this.model()!;
        options.model = monaco.editor.createModel(value || currentValue, language, uri);
      }
    }

    this._editor.set(monaco.editor.create(this.el.nativeElement, options));
    const editor = this._editor()!;

    if (!hasModel) {
      editor.setValue(currentValue);
    }

    editor.onDidChangeModelContent(e => {
      const newValue = editor.getValue();
      this.value.set(newValue);
      this.updatePlaceholder();
      this.editorModelContentChange.emit(e);
    });

    editor.onDidBlurEditorWidget(() => {
      this.touched.set(true);
    });

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

  get editor(): MonacoEditor | null | undefined {
    return this._editor();
  }

  private emitInitEvent(init: boolean) {
    init ? this.init.emit(this._editor()!) : this.reInit.emit(this._editor()!);
  }

  private async format(): Promise<void | null> {
    const action = this.editor?.getAction('editor.action.formatDocument');
    if (!action) return null;
    return action.run();
  }

  private updatePlaceholder() {
    const placeholder = this.placeholder();
    const editor = this.editor;
    const currentValue = this.value();

    if (!placeholder || !editor) return;

    if (!this.placeholderWidget) {
      this.placeholderWidget = new PlaceholderWidget(editor, placeholder, this.placeholderColor());
    }

    const trimmed = currentValue.trim();
    const shouldShow = currentValue.length === 0 || (trimmed.length === 0 && this.showPlaceholderOnWhiteSpace());

    const alreadyAttached = (editor as any)?._contentWidgets?.[this.placeholderWidget.getId()];

    if (shouldShow && !alreadyAttached) {
      editor.addContentWidget(this.placeholderWidget);
    } else if (!shouldShow && alreadyAttached) {
      editor.removeContentWidget(this.placeholderWidget);
    }
  }
}
