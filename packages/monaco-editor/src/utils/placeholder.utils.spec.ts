import { PlaceholderWidget } from './placeholder.utils';

describe('PlaceholderWidget', () => {
  let editorMock: jasmine.SpyObj<monaco.editor.IStandaloneCodeEditor>;
  let widget: PlaceholderWidget;

  beforeEach(() => {
    editorMock = jasmine.createSpyObj('IStandaloneCodeEditor', ['applyFontInfo', 'removeContentWidget']);
  });

  it('should create a widget with default placeholder color', () => {
    widget = new PlaceholderWidget(editorMock, 'Test placeholder');

    const domNode = widget.getDomNode();

    expect(domNode).toBeTruthy();
    expect(domNode.classList).toContain('monaco-editor-placeholder');
    expect(domNode.style.color).toBe('rgba(128, 128, 128, 0.6)');
    expect(domNode.style.fontStyle).toBe('italic');
    expect(domNode.innerHTML).toBe('Test placeholder');
    expect(editorMock.applyFontInfo).toHaveBeenCalledWith(domNode);
  });

  it('should use a custom placeholder color if provided', () => {
    widget = new PlaceholderWidget(editorMock, 'Custom color', 'red');
    const domNode = widget.getDomNode();
    expect(domNode.style.color).toBe('red');
  });

  it('getId should return static widget id', () => {
    widget = new PlaceholderWidget(editorMock, 'Placeholder');
    expect(widget.getId()).toBe('editor.widget.placeholderHint');
  });

  it('getPosition should return the correct position object', () => {
    widget = new PlaceholderWidget(editorMock, 'Placeholder');
    const pos = widget.getPosition();
    expect(pos).toEqual({
      position: { lineNumber: 1, column: 1 },
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
    });
  });

  it('update should change innerHTML if node exists', () => {
    widget = new PlaceholderWidget(editorMock, 'Initial');
    const domNode = widget.getDomNode();

    widget.update('Updated text');
    expect(domNode.innerHTML).toBe('Updated text');

    widget.update(null);
    expect(domNode.innerHTML).toBe('Initial');

    widget.update(undefined);
    expect(domNode.innerHTML).toBe('Initial');
  });

  it('update should do nothing if node is not created yet', () => {
    widget = new PlaceholderWidget(editorMock, 'Initial');
    expect(() => widget.update('New')).not.toThrow();
  });

  it('dispose should remove content widget and node', () => {
    widget = new PlaceholderWidget(editorMock, 'Dispose test');
    const domNode = widget.getDomNode();

    widget.dispose();

    expect(editorMock.removeContentWidget).toHaveBeenCalledWith(widget);
    expect(widget['node']).toBeUndefined();
    expect(domNode.parentElement).toBeNull(); // removed from DOM
  });
});
