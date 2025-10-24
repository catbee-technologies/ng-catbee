import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  output,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { take, timer } from 'rxjs';
import { CatbeeMonacoEditorBase } from './monaco-editor-base';
import { PlaceholderWidget } from '../utils/placeholder.utils';
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
} from '../types/monaco-editor.types';

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
      useExisting: forwardRef(() => CatbeeMonacoEditorComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatbeeMonacoEditorComponent extends CatbeeMonacoEditorBase<MonacoEditor> implements ControlValueAccessor {
  /** The editor model. */
  readonly model = input<CatbeeMonacoEditorModel>();
  /** Whether to automatically format the document on save - default is `true`. */
  readonly autoFormat = input(true, { transform: booleanAttribute });
  /** The placeholder text to show when the editor is empty. */
  readonly placeholder = input<string | null>(null);
  /** The color of the placeholder text - default is `rgba(128, 128, 128, 0.6)`. */
  readonly placeholderColor = input<string>();
  /** Show placeholder when editor is empty but contains whitespace characters - default is `false`. */
  readonly showPlaceholderOnWhiteSpace = input(false, { transform: booleanAttribute });
  /** Emitted when the text inside this editor gained focus (i.e. cursor starts blinking). */
  readonly focus = output<MonacoEditor>();
  /** Emitted when the text inside this editor lost focus (i.e. cursor stops blinking). */
  readonly blur = output<MonacoEditor>();
  /** Emitted when the scroll in the editor has changed. */
  readonly scroll = output<MonacoEditorScrollEvent>();
  /** Emitted when the cursor position has changed. */
  readonly cursorPositionChange = output<MonacoEditorCursorPositionChangedEvent>();
  /** Emitted when the cursor selection has changed. */
  readonly cursorSelectionChange = output<MonacoEditorCursorSelectionChangedEvent>();
  /** Emitted when a context menu is triggered in the editor. */
  readonly contextmenu = output<MonacoEditorMouseEvent>();
  /** Emitted when a paste event occurs in the editor. */
  readonly paste = output<MonacoEditorPasteEvent>();
  /** Emitted when a key is pressed down in the editor. */
  readonly keyDown = output<MonacoEditorKeyboardEvent>();
  /** Emitted when a key is released in the editor. */
  readonly keyUp = output<MonacoEditorKeyboardEvent>();
  /** Emitted when the mouse button is pressed down in the editor. */
  readonly mouseDown = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse button is released in the editor. */
  readonly mouseUp = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse is moved in the editor. */
  readonly mouseMove = output<MonacoEditorMouseEvent>();
  /** Emitted when the mouse leaves the editor. */
  readonly mouseLeave = output<MonacoEditorPartialMouseEvent>();
  /** Emitted when the content of the current model has changed. */
  readonly modelContentChange = output<MonacoModelContentChangedEvent>();

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
      this.modelContentChange.emit(e);
    });
    editor.onDidBlurEditorWidget(() => this.onTouched());

    editor.onDidBlurEditorText(() => this.blur.emit(this._editor!));
    editor.onDidFocusEditorText(() => this.focus.emit(this._editor!));
    editor.onDidChangeCursorPosition(e => this.cursorPositionChange.emit(e));
    editor.onDidChangeCursorSelection(e => this.cursorSelectionChange.emit(e));
    editor.onContextMenu(e => this.contextmenu.emit(e));
    editor.onDidScrollChange(e => this.scroll.emit(e));
    editor.onDidPaste(e => this.paste.emit(e));
    editor.onKeyDown(e => this.keyDown.emit(e));
    editor.onKeyUp(e => this.keyUp.emit(e));
    editor.onMouseDown(e => this.mouseDown.emit(e));
    editor.onMouseUp(e => this.mouseUp.emit(e));
    editor.onMouseMove(e => this.mouseMove.emit(e));
    editor.onMouseLeave(e => this.mouseLeave.emit(e));

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
    if (init) {
      this.init.emit(this._editor!);
    } else {
      this.reInit.emit(this._editor!);
    }
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
