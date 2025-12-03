# @ng-catbee/monaco-editor

## Catbee Monaco Editor for Angular

> A modern Angular library that seamlessly integrates the Monaco Editor, offering full support for both **single** and **diff** editors — fully compatible with Reactive Forms, Template-driven Forms, and Signal Forms.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor" alt="NPM Version" />
  <!-- <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor/rc" alt="NPM RC Version" /> -->
  <!-- <img src="https://img.shields.io/npm/v/@ng-catbee/monaco-editor/next" alt="NPM Next Version" /> -->
  <img src="https://img.shields.io/npm/dt/@ng-catbee/monaco-editor" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=ncloc&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=vulnerabilities&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Vulnerabilities" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/monaco-editor" alt="License" />
</div>

## 📦 Demo

- [Stackblitz](https://stackblitz.com/edit/ng-catbee-monaco-editor-v21?file=src%2Fapp%2Fapp.component.ts)
- [Codesandbox](https://codesandbox.io/p/devbox/ng-catbee-monaco-editor-forked-fs62z7?file=%2Fsrc%2Fapp%2Fapp.component.ts)

## ✨ Features

- 📝 **Single Editor**: Drop-in Monaco editor for Angular apps
- 🔀 **Diff Editor**: Effortlessly compare code side-by-side
- ⚙️ **Supports Reactive, Template-driven & Signal Forms**: (FormControl, ngModel, Signal)
- 🎨 **Customizable**: Language, theme, and editor settings
- 🎨 **Highly Configurable**: theme, language, layout, options
- 🧠 **Full Type Safety**: with rich TypeScript definitions

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |
| `v20` & `v21`   | ✅ v21 release fully supports both Angular 20 and Angular 21 |

This library is built and tested with Angular **20.3.0** and **21.x**, and supports all modern standalone-based Angular projects (v17+).

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
import { CatbeeMonacoEditorModule } from '@ng-catbee/monaco-editor';

@NgModule({
  imports: [
    CatbeeMonacoEditorModule.forRoot({
      baseUrl: 'assets/monaco-editor/' // Path to the folder containing `vs` folder
    }),
  ],
})
export class AppModule {}
```

## ⚡ Quick Example

### Using `ng-catbee-monaco-editor` with `ngModel`
```typescript
import { Component } from '@angular/core';
import { CatbeeMonacoEditor, MonacoEditorOptions, MonacoEditor, MonacoKeyMod, MonacoKeyCode } from '@ng-catbee/monaco-editor';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditor, FormsModule],
  template: `
    <-- Using [(ngModel)] -->
    <ng-catbee-monaco-editor
      [height]="'400px'"
      [width]="'100%'"
      [options]="options"
      [(ngModel)]="code"
      [language]="'typescript'"
      [placeholder]="'Start typing your code here...'"
      (init)="onInit($event)"
      (optionsChange)="onOptionsChange($event)"
    />

    <-- Using [(value)] -->
    <ng-catbee-monaco-editor
      [(value)]="code"
      [language]="'javascript'"
    />
  `,
})
export class AppComponent {
  options: MonacoEditorOptions = {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true }
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

### Using `ng-catbee-monaco-editor` with Reactive Forms
```typescript
import { Component } from '@angular/core';
import { CatbeeMonacoEditor } from '@ng-catbee/monaco-editor';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditor, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ng-catbee-monaco-editor
        formControlName="code"
        [language]="'typescript'"
      />
    </form>
  `,
})
export class AppComponent {
  form = new FormGroup({
    code: new FormControl(`function hello() {\n  console.log('Hello, world!');\n}`, [
      Validators.required,
      Validators.minLength(10)
    ])
  });
}
```

### Using `ng-catbee-monaco-editor-v2` with Signal Forms(Angular v21+)
```typescript
import { Component } from '@angular/core';
import { CatbeeMonacoEditorV2 } from '@ng-catbee/monaco-editor';
import { Field, form, required, minLength } from '@angular/forms/signals';

@Component({
  selector: 'app-root',
  imports: [CatbeeMonacoEditorV2, Field],
  template: `
    <ng-catbee-monaco-editor-v2
      [field]="myForm"
      [language]="'typescript'"
    />
  `,
})
export class AppComponent {
  singleModel = signal(`function hello() {\n  console.log('Hello, world!');\n}`);

  myForm = form(this.singleModel, (path)=> {
    required(path, { message: 'Code is required'  });
    minLength(path, 10, { message: 'Code must be at least 10 characters long' });
  });
}
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/intro/)

- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/intro/)
- [Installation and Configuration](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/installation/)
- [Module Setup](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/usage/module-setup/)
- [Single Editor Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/usage/single-editor/)
- [Diff Editor Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/usage/diff-editor/)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/api-reference/)
- [Type Definitions](https://catbee.npm.hprasath.com/docs/@ng-catbee/monaco-editor/types/)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/typedoc/index.html)
- [Monaco Editor Options](https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html)
- [Angular Documentation](https://angular.io/)
- [Catbee Technologies](https://github.com/catbee-technologies)
