export class PlaceholderWidget implements monaco.editor.IContentWidget {
  private static readonly id = 'editor.widget.placeholderHint';
  private node?: HTMLElement;

  constructor(
    private readonly editor: monaco.editor.IStandaloneCodeEditor,
    private readonly placeholder?: string,
    private readonly placeholderColor: string = 'rgba(128, 128, 128, 0.6)'
  ) {}

  /** Update the placeholder text displayed in the widget. */
  update(text?: string | null): void {
    if (!this.node) return;
    this.node.innerHTML = text ?? this.placeholder ?? '';
  }

  /** Get the unique identifier of the widget. */
  getId(): string {
    return PlaceholderWidget.id;
  }

  /** Get the DOM node of the widget. */
  getDomNode(): HTMLElement {
    if (!this.node) {
      const node = (this.node = document.createElement('div'));
      node.classList.add('monaco-editor-placeholder');
      node.style.width = 'max-content';
      node.style.color = this.placeholderColor;
      node.innerHTML = this.placeholder!;
      node.style.fontStyle = 'italic';
      node.style.pointerEvents = 'none';
      node.style.userSelect = 'none';
      this.editor.applyFontInfo(node);
    }
    return this.node;
  }

  /** Get the position of the widget in the editor. */
  getPosition(): monaco.editor.IContentWidgetPosition | null {
    return {
      position: { lineNumber: 1, column: 1 },
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
    };
  }

  /**
   * Dispose the widget and its event listeners.
   */
  dispose(): void {
    this.editor.removeContentWidget(this);
    this.node?.remove();
    this.node = undefined;
  }
}
