export type Monaco = typeof monaco;
/** Monaco Standalone Editor */
export type MonacoEditor = monaco.editor.IStandaloneCodeEditor;
/** Monaco Standalone Editor Options */
export type MonacoEditorOptions = monaco.editor.IStandaloneEditorConstructionOptions;
/** Monaco Diff Editor */
export type MonacoDiffEditor = monaco.editor.IStandaloneDiffEditor;
/** Monaco Diff Editor Options */
export type MonacoDiffEditorOptions = monaco.editor.IStandaloneDiffEditorConstructionOptions;
/** Monaco Model Content Changed Event */
export type MonacoModelContentChangedEvent = monaco.editor.IModelContentChangedEvent;
/** Monaco Editor Keyboard Event */
export type MonacoEditorKeyboardEvent = monaco.IKeyboardEvent;
/** Monaco Editor Mouse Event */
export type MonacoEditorMouseEvent = monaco.editor.IEditorMouseEvent;
/** Monaco Editor Partial Mouse Event */
export type MonacoEditorPartialMouseEvent = monaco.editor.IPartialEditorMouseEvent;
/** Monaco Editor Language Changed Event */
export type MonacoEditorLanguageChangedEvent = monaco.editor.IModelLanguageChangedEvent;
/** Monaco Editor Scroll Event */
export type MonacoEditorScrollEvent = monaco.IScrollEvent;
/** Monaco Editor Cursor Position Changed Event */
export type MonacoEditorCursorPositionChangedEvent = monaco.editor.ICursorPositionChangedEvent;
/** Monaco Editor Cursor Selection Changed Event */
export type MonacoEditorCursorSelectionChangedEvent = monaco.editor.ICursorSelectionChangedEvent;
/** Monaco Editor Paste Event */
export type MonacoEditorPasteEvent = monaco.editor.IPasteEvent;
/** Monaco Key Code */
export type MonacoKeyCode = monaco.KeyCode;
/** Monaco Key Modifier */
export enum MonacoKeyMod {
  CtrlCmd = 2048,
  Shift = 1024,
  Alt = 512,
  WinCtrl = 256
}
/** Monaco Builtin Theme */
export type MonacoBuiltinTheme = monaco.editor.BuiltinTheme;
/** Monaco Editor Theme Data */
export type MonacoEditorCustomThemeData = monaco.editor.IStandaloneThemeData;
/** Model for Catbee Monaco Editor Component */
export interface CatbeeMonacoEditorModel {
  value?: string;
  language?: string;
  uri?: monaco.Uri;
}
/** Model for Catbee Monaco Diff Editor Component */
export interface CatbeeMonacoDiffEditorModel {
  value: string;
  language?: string;
}
/** Event emitted by Catbee Monaco Diff Editor Component */
export interface CatbeeMonacoDiffEditorEvent {
  original: string;
  modified: string;
}
