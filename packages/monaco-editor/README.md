# @ng-catbee/monaco-editor

## Catbee Monaco Editor for Angular

> A modern Angular library that seamlessly integrates the Monaco Editor, offering full support for both **single** and **diff** editors.


<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor" alt="NPM Version" />
  <!-- <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor/rc" alt="NPM RC Version" /> -->
  <!-- <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor/next" alt="NPM Next Version" /> -->
  <img src="https://img.shields.io/npm/dt/@ng-catbee/monaco-editor" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <!-- <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=ncloc&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=vulnerabilities&token=93da835f2d48d37b41fa628cc7fc764c873bd700" alt="Vulnerabilities" /> -->
  <img src="https://img.shields.io/npm/l/@ng-catbee/monaco-editor" alt="License" />
</div>

## 📦 Demo

- [Stackblitz](https://stackblitz.com/edit/ng-catbee-monaco-editor?file=src%2Fmain.ts)
- [Codesandbox](https://codesandbox.io/p/sandbox/ng-catbee-monaco-editor-txmm59)

## ✨ Features

- 📝 **Single Editor**: Drop-in Monaco editor for Angular apps
- 🔀 **Diff Editor**: Effortlessly compare code side-by-side
- 🎨 **Customizable**: Language, theme, and editor settings
- ⚡ **Reactive Forms & Events**: Seamless integration
- 🛡️ **TypeScript Typings**: Full type safety

## 🛠️ Installation

```bash
npm install @ng-catbee/monaco-editor --save
npm install monaco-editor --save # Optional: for local assets
```

## 📂 Configure `monaco-editor` library assets

By default, Monaco Editor is loaded lazily from the CDN (`https://cdn.jsdelivr.net/npm/monaco-editor`). You can also use local assets if preferred.

If you are using local monaco editor library, you could add the following to your `angular.json` file:

```json
"assets": [
  {
    "glob": "**/*",
    "input": "node_modules/monaco-editor/min/vs", // Path to `vs` folder in monaco-editor package
    "output": "/assets/monaco-editor/vs" // Make sure the path you set contains the `/vs` folder
  }
],
```
Or you can copy the `vs` folder from `node_modules/monaco-editor/min/` to your `src/assets/monaco-editor/` folder manually.

Then set the `baseUrl` option in the module configuration to point to your local assets:

```typescript
CatbeeMonacoEditorModule.forRoot({
  baseUrl: 'assets/monaco-editor/'
}),
```

## 📚 Usage

### 1. Import the Module

#### 1.1 Use in NgModule
```typescript
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

@NgModule({
	imports: [
      CatbeeMonacoEditorModule.forRoot({
        // Customization options - OPTIONAL
      }),
  ]
})
export class AppModule {}
```
or
#### 1.2 Use in Standalone Components
```typescript
import { provideCatbeeMonacoEditor } from '@ng-catbee/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeMonacoEditor({
      // Customization options - OPTIONAL
    })
  ]
};
```
or
#### 1.3 Use in ApplicationConfig
```typescript
import { importProvidersFrom } from '@angular/core';
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      CatbeeMonacoEditorModule.forRoot({
        // Customization options - OPTIONAL
      })
    )
  ]
};
```

### 2. CatbeeMonacoEditorComponent Example

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoEditorComponent, MonacoEditorOptions, MonacoEditor, MonacoKeyMod, MonacoKeyCode } from '@ng-catbee/monaco-editor';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditorComponent],
  template: `
    <ng-catbee-monaco-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [(ngModel)]="code"
      [placeholder]="'Start typing your code here...'"
      (init)="onInit($event)"
      (optionsChange)="onOptionsChange($event)"
    />
  `,
})
export class AppComponent {
  options: MonacoEditorOptions = {
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  };

  code = `function hello() {\n  console.log('Hello, world!');\n}`;
  onInit(editor: MonacoEditor) {
    console.log('Editor initialized:', editor);

    editor.addCommand(MonacoKeyMod.CtrlCmd | MonacoKeyCode.KEY_S, () => {
      console.log('Ctrl+S pressed - implement save logic here');
    });
  }

  onOptionsChange(newOptions: MonacoEditorOptions) {
    console.log('Editor options changed:', newOptions);
  }
}

```
### 3. CatbeeMonacoDiffEditorComponent Example

```ts
import { Component } from '@angular/core';
import { CatbeeMonacoDiffEditorComponent, MonacoEditorOptions, CatbeeMonacoDiffEditorModel, CatbeeMonacoDiffEditorEvent } from '@ng-catbee/monaco-editor';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoDiffEditorComponent],
  template: `
    <ng-catbee-monaco-diff-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [original]="originalCode"
      [modified]="modifiedCode"
      (diffUpdate)="onDiffUpdate($event)"
    />
  `
})
export class AppComponent {
  options: MonacoEditorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false }
  };

  originalCode: CatbeeMonacoDiffEditorModel = {
    value: 'function hello() {\n\talert("Hello, world!");\n}',
    language: 'javascript'
  };

  modifiedCode: CatbeeMonacoDiffEditorModel = {
    value: 'function hello() {\n\talert("");\n}',
    language: 'javascript'
  };

  onDiffUpdate(event: CatbeeMonacoDiffEditorEvent) {
    console.log('Diff updated:', event.original, event.modified);
  }
}
```

## ⚙️ Configuration Options
The `CatbeeMonacoEditorGlobalConfig` interface defines the configuration options for the Monaco Editor module, which can be provided using the `forRoot()` method of `CatbeeMonacoEditorModule` or via the `provideCatbeeMonacoEditor()`, as shown below:

```ts
{
  baseUrl: string; // Base URL for monaco-editor assets (default: 'https://cdn.jsdelivr.net/npm/monaco-editor/min')
  defaultOptions: MonacoEditorOptions; // Default editor options
  monacoPreLoad: () => void; // Callback before monaco is loaded
  monacoLoad: (monaco: typeof monaco) => void; // Callback after monaco is loaded
  autoFormatTime: number; // Time to auto format after init (default: 100ms)
  resizeDebounceTime: number; // Debounce time for resize events (default: 100ms)
}
```

### Example Configuration

```ts
CatbeeMonacoEditorModule.forRoot({
  baseUrl: 'assets/monaco-editor/', // Use local assets
  defaultOptions: { theme: 'vs-dark', language: 'typescript' },
  monacoLoad: (monaco) => {
    // Custom monaco configurations

    // 1. Define a custom theme
    monaco.editor.defineTheme('myCustomTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [{ background: '1E1E1E' }],
      colors: {
        'editor.background': '#1E1E1E',
      },
    });

    // 2. Set TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
    });

    // 3. Add extra libraries
    monaco.languages.typescript.typescriptDefaults.addExtraLibs([
      {
        content: 'declare var myGlobalVar: string;',
        filePath: 'file:///node_modules/@types/my-global-var/index.d.ts',
      },
    ]);
  },
  autoFormatTime: 200,
  resizeDebounceTime: 150,
}),
```

## 📖 API Reference

### `CatbeeMonacoEditorComponent`: Single editor

#### Properties
| Property | Description | Type | Default |
|----------|-------------|------|---------|
| `[height]` | Height of Monaco Editor | `string` | `300px` |
| `[width]` | Width of Monaco Editor | `string` | `100%` |
| `[disabled]` | Disabled of monaco editor | `boolean` | `false` |
| `[placeholder]` | Placeholder of monaco editor, Can change the style via defining the `.monaco-editor-placeholder` CSS. | `string` | - |
| `[placeholderColor]` | Color of the placeholder text | `string` | `rgba(128, 128, 128, 0.6)` |
| `[showPlaceholderOnWhiteSpace]` | Show placeholder when editor is empty but contains whitespace characters | `boolean` | `false` |
| `[autoFormat]` | Whether to automatically format the document | `boolean` | `true` |
| `[options]` | Default options when creating editors | `MonacoEditorOptions` | - |
| `[initDelay]` | Delay initializing monaco editor in ms | `number` | `0` |
| `[model]` | Model of monaco editor | `CatbeeMonacoEditorModel` | - |
| `[reInitOnOptionsChange]` | Whether to re-initialize the editor instance when options change. By default, the editor will re-initialize only if the language option changes. Note: Some options (like language) may require re-initialization to take effect. | `boolean` | `false` |

#### Events
| Event  | Description | Type |
|--------|-------------|------|
| `(init)` | Event emitted when the editor is initialized | `EventEmitter<MonacoEditor>` |
| `(reInit)` | Event emitted when the editor is re-initialized | `EventEmitter<MonacoEditor>` |
| `(initError)` | Event emitted when the editor initialization fails | `EventEmitter<unknown>` |
| `(resize)` | Event emitted when the editor is resized | `EventEmitter<MonacoEditor>` |
| `(optionsChange)` | Event emitted when the editor options are changed | `EventEmitter<MonacoEditorOptions>` |
| `(focus)` | Event emitted when the text inside this editor gained focus | `EventEmitter<MonacoEditor>` |
| `(blur)` | Event emitted when the text inside this editor lost focus | `EventEmitter<MonacoEditor>` |
| `(scroll)` | Event emitted when the scroll in the editor has changed | `EventEmitter<MonacoEditorScrollEvent>` |
| `(cursorPositionChange)` | Event emitted when the cursor position has changed | `EventEmitter<MonacoEditorCursorPositionChangedEvent>` |
| `(cursorSelectionChange)` | Event emitted when the cursor selection has changed | `EventEmitter<MonacoEditorCursorSelectionChangedEvent>` |
| `(contextmenu)` | Event emitted when a context menu is triggered in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(paste)` | Event emitted when a paste event occurs in the editor | `EventEmitter<MonacoEditorPasteEvent>` |
| `(keyDown)` | Event emitted when a key is pressed down in the editor | `EventEmitter<MonacoEditorKeyboardEvent>` |
| `(keyUp)` | Event emitted when a key is released in the editor | `EventEmitter<MonacoEditorKeyboardEvent>` |
| `(mouseDown)` | Event emitted when the mouse button is pressed down in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(mouseUp)` | Event emitted when the mouse button is released in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(mouseMove)` | Event emitted when the mouse is moved in the editor | `EventEmitter<MonacoEditorMouseEvent>` |
| `(mouseLeave)` | Event emitted when the mouse leaves the editor | `EventEmitter<MonacoEditorPartialMouseEvent>` |
| `(modelContentChange)` | Event emitted when the content of the current model has changed | `EventEmitter<MonacoModelContentChangedEvent>` |

### `CatbeeMonacoDiffEditorComponent`: Diff editor

#### Properties
| Property | Description | Type | Default |
|----------|-------------|------|---------|
| `[height]` | Height of Monaco Editor | `string` | `300px` |
| `[width]` | Width of Monaco Editor | `string` | `100%` |
| `[disabled]` | Disabled of monaco editor | `boolean` | `false` |
| `[options]` | Default options when creating editors | `MonacoEditorOptions` | - |
| `[initDelay]` | Delay initializing monaco editor in ms | `number` | `0` |
| `[model]` | Model of monaco editor | `CatbeeMonacoEditorModel` | - |
| `[original]` | The original model to compare | `CatbeeMonacoDiffEditorModel` | - |
| `[modified]` | The modified model to compare against the original | `CatbeeMonacoDiffEditorModel` | - |
| `[originalEditable]` | Whether the original editor is editable | `boolean` | `false` |

#### Events
| Event  | Description | Type |
|--------|-------------|------|
| `(init)` | Event emitted when the editor is initialized | `EventEmitter<MonacoEditor>` |
| `(reInit)` | Event emitted when the editor is re-initialized | `EventEmitter<MonacoEditor>` |
| `(initError)` | Event emitted when the editor initialization fails | `EventEmitter<unknown>` |
| `(resize)` | Event emitted when the editor is resized | `EventEmitter<MonacoEditor>` |
| `(optionsChange)` | Event emitted when the editor options are changed | `EventEmitter<MonacoEditorOptions>` |
| `(diffUpdate)` | Event emitted when the diff information computed by this diff editor has been updated | `EventEmitter<CatbeeMonacoDiffEditorEvent>` |

## 🧩 Type Definitions
Below are the key exported types and interfaces available in @ng-catbee/monaco-editor for strong typing and IntelliSense support:

### Core Monaco Types
- **`Monaco`** — The Monaco namespace.
- **`MonacoEditor`** — The Monaco standalone code editor interface.
- **`MonacoEditorOptions`** — Configuration options for the Monaco standalone code editor.
- **`MonacoDiffEditor`** — The Monaco standalone diff editor interface.
- **`MonacoDiffEditorOptions`** — Configuration options for the Monaco standalone diff editor.

### Editor Events & Models
- **`MonacoModelContentChangedEvent`** — Event for content changes in a Monaco model.
- **`MonacoEditorKeyboardEvent`** — Event for keyboard interactions in the editor.
- **`MonacoEditorMouseEvent`** — Event for mouse interactions in the editor.
- **`MonacoEditorPartialMouseEvent`** — Partial mouse event type for editor mouse interactions.
- **`MonacoEditorLanguageChangedEvent`** — Event fired when the language of a model changes.
- **`MonacoEditorScrollEvent`** — Event for scroll position changes in the editor.
- **`MonacoEditorCursorPositionChangedEvent`** — Event for cursor position changes.
- **`MonacoEditorCursorSelectionChangedEvent`** — Event for cursor selection changes.
- **`MonacoEditorPasteEvent`** — Event for paste operations in the editor.

### Keyboard & Theme
- **`MonacoKeyCode`** — Enumeration for key codes used by Monaco.
- **`MonacoKeyMod`** — Enumeration for modifier keys (Ctrl, Alt, etc.).
- **`MonacoBuiltinTheme`** — Built-in Monaco editor theme type.
- **`MonacoEditorCustomThemeData`** — Interface for defining custom Monaco editor themes.

### Catbee-Specific Types
- **`CatbeeMonacoEditorModel`** — Model interface for the single editor component.
- **`CatbeeMonacoDiffEditorModel`** — Model interface for the diff editor component.
- **`CatbeeMonacoDiffEditorEvent`** — Event interface emitted by the diff editor component.

### Configuration Interface
- **`CatbeeMonacoEditorGlobalConfig`** — Global configuration options for the Catbee Monaco Editor module.

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee-utils.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/typedoc/index.html)
- [Monaco Editor Options](https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html)
- [Angular Documentation](https://angular.io/)
- [Catbee Technologies](https://github.com/catbee-technologies)
