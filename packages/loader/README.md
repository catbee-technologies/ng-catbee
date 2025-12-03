# @ng-catbee/loader

## Catbee Loader for Angular

> A modern, customizable Angular library for displaying beautiful loading indicators and spinners with 50+ animation styles and featuring advanced options like fullscreen mode, custom templates, and multiple concurrent loaders.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/loader" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/loader" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/loader" alt="License" />
</div>

## 📦 Demo

[Stackblitz](https://stackblitz.com/edit/ng-catbee-browser-storage?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🎨 **50+ Animation Styles**: Beautiful pre-built loading animations
- 🎯 **Multiple Loaders**: Support for multiple named loaders simultaneously
- 🎭 **Customizable**: Colors, sizes, animations, and custom templates
- 📱 **Fullscreen Mode**: Optional fullscreen overlay with backdrop
- ⏱️ **Programmatic Control**: Show/hide with optional delays
- 🌐 **SSR Compatible**: Works seamlessly with Server-Side Rendering
- 🎨 **Custom Templates**: Use your own HTML templates
- 📦 **Lightweight**: Minimal bundle size with tree-shaking support
- 🔧 **Global Configuration**: Configure defaults for all loaders

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |

This library is built and tested with Angular **20.x**, and supports all modern standalone-based Angular projects (v17+).

## 🛠️ Installation

```bash
npm install @ng-catbee/loader
```

## 🔧 Configuration (Optional)

**Standalone apps:**
```typescript
import { provideCatbeeLoader } from '@ng-catbee/loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeLoader({
      animation: 'ball-spin-clockwise',
      size: 'medium',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      loaderColor: '#ffffff',
      zIndex: 999999
    })
  ]
};
```

**Module-based apps:**
```typescript
import { CatbeeLoaderModule } from '@ng-catbee/loader';

@NgModule({
  imports: [
    CatbeeLoaderModule.forRoot({
      animation: 'ball-spin-clockwise',
      size: 'medium',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      loaderColor: '#ffffff',
      zIndex: 999999
    })
  ]
})
export class AppModule { }
```

> Global configuration sets defaults. Override per-method by passing `options`.


## 📂 Import Animation Styles

**Important:** You must import the CSS file for the animation you want to use. Each animation has its own CSS file.

### Option 1: Import in `styles.css` (Recommended)

```css
/* Import the animation style you need */
@import 'node_modules/@ng-catbee/loader/css/ball-spin-clockwise.css';

/* Or import multiple animations */
@import 'node_modules/@ng-catbee/loader/css/ball-grid-pulse.css';
@import 'node_modules/@ng-catbee/loader/css/line-scale.css';
```

### Option 2: Add to `angular.json` styles array

```json
{
  "styles": [
    "src/styles.css",
    "node_modules/@ng-catbee/loader/css/ball-spin-clockwise.css",
    "node_modules/@ng-catbee/loader/css/line-scale.css"
  ]
}
```

💡 **Preview all animations:** [https://labs.danielcardoso.net/load-awesome/animations.html](https://labs.danielcardoso.net/load-awesome/animations.html)

## ⚡ Quick Start

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoader, CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatbeeLoader],
  template: `
    <catbee-loader />
    
    <button (click)="showLoader()">Show Loader</button>
    <button (click)="hideLoader()">Hide Loader</button>
  `,
})
export class AppComponent {
  private loaderService = inject(CatbeeLoaderService);

  async showLoader() {
    await this.loaderService.show();
  }

  async hideLoader() {
    await this.loaderService.hide();
  }
}
```

### Customized Loader

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoader, CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-custom',
  standalone: true,
  imports: [CatbeeLoader],
  template: `
    <catbee-loader
      name="custom"
      animation="ball-grid-pulse"
      size="large"
      [backgroundColor]="'rgba(0, 123, 255, 0.8)'"
      [loaderColor]="'#ffffff'"
      [fullscreen]="true"
      [message]="'Loading your data...'"
    />
  `,
})
export class CustomLoaderComponent {
  private loaderService = inject(CatbeeLoaderService);

  async loadData() {
    await this.loaderService.show('custom');
    
    try {
      // Perform async operations
      await this.fetchData();
    } finally {
      await this.loaderService.hide('custom');
    }
  }

  private async fetchData() {
    // Your data fetching logic
  }
}
```

### Multiple Named Loaders

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoader, CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-multi',
  standalone: true,
  imports: [CatbeeLoader],
  template: `
    <!-- Main content loader -->
    <catbee-loader 
      name="main" 
      animation="ball-spin-clockwise"
    />
    
    <!-- Sidebar loader -->
    <catbee-loader 
      name="sidebar" 
      animation="line-scale"
      [fullscreen]="false"
      [zIndex]="1000"
    />
  `,
})
export class MultiLoaderComponent {
  private loaderService = inject(CatbeeLoaderService);

  async loadContent() {
    // Show main loader
    await this.loaderService.show('main');
    await this.fetchMainContent();
    await this.loaderService.hide('main');
  }

  async loadSidebar() {
    // Show sidebar loader independently
    await this.loaderService.show('sidebar');
    await this.fetchSidebarData();
    await this.loaderService.hide('sidebar');
  }

  private async fetchMainContent() { /* ... */ }
  private async fetchSidebarData() { /* ... */ }
}
```

### Runtime Options Override

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-runtime',
  template: `<catbee-loader name="dynamic" />`,
})
export class RuntimeComponent {
  private loaderService = inject(CatbeeLoaderService);

  async showCustomLoader() {
    // Override component inputs at runtime
    await this.loaderService.show('dynamic', {
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      loaderColor: '#ffff00',
      size: 'large',
      animation: 'pacman',
      message: 'Processing...',
      fullscreen: false,
      zIndex: 10000
    });
    
    await this.processData();
    await this.loaderService.hide('dynamic');
  }

  private async processData() { /* ... */ }
}
```

### Custom Templates

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoader, CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-custom-template',
  standalone: true,
  imports: [CatbeeLoader],
  template: `
    <catbee-loader
      name="custom-template"
      [customTemplate]="customHtml"
    />
  `,
})
export class CustomTemplateComponent {
  private loaderService = inject(CatbeeLoaderService);

  customHtml = `
    <div style="text-align: center; color: white;">
      <h2>Please Wait...</h2>
      <div class="spinner">⏳</div>
      <p>We're preparing your content</p>
    </div>
  `;

  async showCustom() {
    await this.loaderService.show('custom-template');
  }
}
```

### Service API

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-service-demo',
  template: `<catbee-loader />`,
})
export class ServiceDemoComponent {
  private loaderService = inject(CatbeeLoaderService);

  async demonstrateAPI() {
    // Show loader
    await this.loaderService.show();

    // Check if visible
    const isVisible = this.loaderService.isVisible(); // true

    // Get loader state
    const state = this.loaderService.getState();
    console.log('Loader state:', state);

    // Get all visible loaders
    const visibleLoaders = this.loaderService.getVisibleLoaders();
    console.log('Visible loaders:', visibleLoaders);

    // Hide specific loader
    await this.loaderService.hide();
    // Hide all loaders at once
    await this.loaderService.hideAll();

    // Observe loader state changes
    this.loaderService.watch().subscribe(state => {
      console.log('Loader state changed:', state);
    });
  }
}
```

## 🎨 Available Animations

The library includes 50+ beautiful loading animations. Each animation requires its corresponding CSS file to be imported.

💡 **Live Preview:** See all animations in action at [https://labs.danielcardoso.net/load-awesome/animations.html](https://labs.danielcardoso.net/load-awesome/animations.html)

**Ball Animations:**
- `ball-8bits`, `ball-atom`, `ball-beat`, `ball-circus`, `ball-climbing-dot`
- `ball-clip-rotate`, `ball-clip-rotate-multiple`, `ball-clip-rotate-pulse`
- `ball-elastic-dots`, `ball-fall`, `ball-fussion`
- `ball-grid-beat`, `ball-grid-pulse`, `ball-newton-cradle`
- `ball-pulse`, `ball-pulse-rise`, `ball-pulse-sync`
- `ball-rotate`, `ball-running-dots`, `ball-scale`
- `ball-scale-multiple`, `ball-scale-pulse`
- `ball-scale-ripple`, `ball-scale-ripple-multiple`
- `ball-spin`, `ball-spin-clockwise`, `ball-spin-clockwise-fade`
- `ball-spin-clockwise-fade-rotating`, `ball-spin-fade`, `ball-spin-fade-rotating`
- `ball-spin-rotate`, `ball-square-clockwise-spin`, `ball-square-spin`
- `ball-triangle-path`, `ball-zig-zag`, `ball-zig-zag-deflect`

**Line Animations:**
- `line-scale`, `line-scale-party`
- `line-scale-pulse-out`, `line-scale-pulse-out-rapid`
- `line-spin-clockwise-fade`, `line-spin-clockwise-fade-rotating`
- `line-spin-fade`, `line-spin-fade-rotating`

**Other Animations:**
- `cog`, `cube-transition`, `fire`, `pacman`
- `square-jelly-box`, `square-loader`, `square-spin`
- `timer`, `triangle-skew-spin`

## 📚 API Reference

### Component: `<catbee-loader>`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | `'default'` | Unique identifier for the loader |
| `animation` | `LoaderAnimation` | `'ball-spin-clockwise'` | Animation style |
| `size` | `'small' \| 'medium' \| 'large'` | `''` | Loader size |
| `backgroundColor` | `string` | `'rgba(0,0,0,0.7)'` | Overlay background color |
| `loaderColor` | `string` | `'#ffffff'` | Loader/spinner color |
| `fullscreen` | `boolean` | `true` | Fullscreen overlay mode |
| `zIndex` | `number` | `999999` | CSS z-index value |
| `message` | `string` | `null` | Optional loading message |
| `customTemplate` | `string` | `null` | Custom HTML template |
| `width` | `string` | `'100%'` | Loader container width |
| `height` | `string` | `'100%'` | Loader container height |

### Component Outputs
| Output | Type | Description |
|--------|------|-------------|
| `visibleChange` | `EventEmitter<boolean>` | Emits when loader visibility changes |

### Service: `CatbeeLoaderService`

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `show()` | `name: string, options?: LoaderDisplayOptions` | `Promise<void>` | Show a loader |
| `hide()` | `name: string, delay?: number` | `Promise<void>` | Hide a loader |
| `hideAll()` | - | `Promise<void>` | Hide all active loaders |
| `isVisible()` | `name: string` | `boolean` | Check if loader is visible |
| `getState()` | `name: string` | `LoaderState \| undefined` | Get loader state |
| `getVisibleLoaders()` | - | `string[]` | Get names of all visible loaders |
| `watch()` | `name: string` | `Observable<LoaderState>` | Observe loader state changes |

### LoaderDisplayOptions

```typescript
interface LoaderDisplayOptions {
  backgroundColor?: string;
  loaderColor?: string;
  size?: LoaderSize;
  animation?: LoaderAnimation;
  fullscreen?: boolean;
  zIndex?: number;
  customTemplate?: string;
  message?: string;
}
```

### Global Configuration

```typescript
export interface CatbeeLoaderGlobalConfig {
  animation?: CatbeeLoaderAnimation;
  size?: CatbeeLoaderSize;
  backgroundColor?: string;
  loaderColor?: string;
  zIndex?: number;
  fullscreen?: boolean;
  message?: string | null;
  customTemplate?: string | null;
}
```

## 🎯 Common Use Cases

### HTTP Interceptor Integration

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CatbeeLoaderService } from '@ng-catbee/loader';
import { finalize } from 'rxjs/operators';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(CatbeeLoaderService);
  
  loaderService.show('http-loader');
  
  return next(req).pipe(
    finalize(() => loaderService.hide('http-loader'))
  );
};
```

### Route Guard with Loader

```typescript
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CatbeeLoaderService } from '@ng-catbee/loader';

export const dataGuard: CanActivateFn = async (route, state) => {
  const loaderService = inject(CatbeeLoaderService);
  
  await loaderService.show('route-guard');
  
  try {
    // Fetch required data
    const hasAccess = await checkAccess();
    return hasAccess;
  } finally {
    await loaderService.hide('route-guard');
  }
};

async function checkAccess(): Promise<boolean> {
  // Your access check logic
  return true;
}
```

### Form Submission

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLoaderService } from '@ng-catbee/loader';

@Component({
  selector: 'app-form',
  template: `
    <catbee-loader name="form-submit" />
    <form (ngSubmit)="onSubmit()">
      <!-- form fields -->
      <button type="submit">Submit</button>
    </form>
  `,
})
export class FormComponent {
  private loaderService = inject(CatbeeLoaderService);

  async onSubmit() {
    await this.loaderService.show('form-submit', {
      message: 'Saving your changes...'
    });

    try {
      await this.saveForm();
      // Show success message
    } catch (error) {
      // Handle error
    } finally {
      await this.loaderService.hide('form-submit');
    }
  }

  private async saveForm() {
    // Your form submission logic
  }
}
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/loader/intro/)


- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/loader/intro/)
- [Installation and Configuration](https://catbee.npm.hprasath.com/docs/@ng-catbee/loader/installation/)
- [Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/loader/usage/)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/loader/api-reference/)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Angular Documentation](https://angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Catbee Technologies](https://github.com/catbee-technologies)
