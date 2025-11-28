# @ng-catbee/storage

## Catbee Storage for Angular

> A modern, type-safe Angular library for simplified interaction with web storage APIs (localStorage and sessionStorage) — fully compatible with Server-Side Rendering (SSR) and offering advanced features like JSON storage, boolean/number parsing, enum validation, reactive observables, and configurable encoding strategies.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/storage" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/storage" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/storage" alt="License" />
</div>

## 📦 Demo

[Stackblitz](https://stackblitz.com/edit/ng-catbee-storage?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🔒 **Type-Safe** - Full TypeScript support with generics
- 📦 **Dual Storage** - Separate services for localStorage and sessionStorage
- 🎯 **Advanced Getters** - Built-in support for JSON, arrays, booleans, numbers, and enums
- 🔄 **Reactive** - Observable-based change detection with RxJS
- 🌐 **SSR Compatible** - Gracefully handles server-side rendering
- 🎨 **Configurable Encoding** - Base64, custom, or no encoding
- ⚡ **Bulk Operations** - Get/set multiple items at once
- 📦 **Zero Dependencies**: Lightweight with no external dependencies

## 🛠️ Installation

```bash
npm install @ng-catbee/storage
```

## 🔧 Configuration (Optional)

**Standalone apps:**
```typescript
import { provideCatbeeStorage } from '@ng-catbee/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeStorage({
      {
        common: {
          encoding: 'default' // 'default', 'base64', 'custom'
        },
        localStorage: { 
          encoding: 'custom',
          customEncode: (value: string) => `catbee-${value}`, // Replace with your custom logic
          customDecode: (value: string) => value.replace('catbee-', '') // Replace with your custom logic
        },
      }
    })
  ]
};
```

**Module-based apps:**
```typescript
import { CatbeeStorageModule } from '@ng-catbee/storage';

@NgModule({
  imports: [
    CatbeeStorageModule.forRoot({
      common: {
        encoding: 'base64' // 'default', 'base64', 'custom'
      },
      localStorage: { 
        encoding: 'custom',
        customEncode: (value: string) => `catbee-${value}`, // Replace with your custom logic
        customDecode: (value: string) => value.replace('catbee-', '') // Replace with your custom logic
      },
    })
  ]
})
export class AppModule { }
```

## ⚡ Quick Start

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService, SessionStorageService } from '@ng-catbee/storage';

interface UserSettings {
  theme: string;
  language: string;
}

@Component({
  selector: 'app-root',
  template: `
    <button (click)="save()">Save</button>
    <button (click)="load()">Load</button>
    <p>{{ data }}</p>
  `
})
export class AppComponent {
  private localStorage = inject(LocalStorageService);
  private sessionStorage = inject(SessionStorageService);
  data = '';

  save() {
    // localStorage (persists across sessions)
    this.localStorage.set('username', 'john_doe');
    this.localStorage.setJson('settings', { theme: 'dark', language: 'en' });
    
    // sessionStorage (cleared when tab closes)
    this.sessionStorage.set('tempToken', 'abc123');
  }

  load() {
    const username = this.localStorage.get('username') ?? 'Guest';
    const settings = this.localStorage.getJsonWithDefault<UserSettings>('settings', { theme: 'light', language: 'en' });
    this.data = `User: ${username}, Theme: ${settings.theme}`;
  }
}
```

### Type-Safe Methods

```typescript
@Component({ selector: 'app-typed' })
export class TypedComponent {
  private localStorage = inject(LocalStorageService);

  examples() {
    // Boolean (recognizes: true/false, 1/0, yes/no, on/off)
    this.localStorage.set('darkMode', 'true');
    const isDark = this.localStorage.getBooleanWithDefault('darkMode', false); // true

    // Number (handles integers and floats)
    this.localStorage.set('count', '42');
    const count = this.localStorage.getNumberWithDefault('count', 0); // 42

    // Enum with validation
    type Theme = 'light' | 'dark';
    const theme = this.localStorage.getEnumWithDefault('theme', 'light', ['light', 'dark']);

    // Arrays
    this.localStorage.setArray('tags', ['angular', 'typescript']);
    const tags = this.localStorage.getArrayWithDefault<string>('tags', []);
    
    // Nullable returns (when you don't want auto-set defaults)
    const maybeNumber = this.localStorage.getNumber('optionalCount'); // number | null
    const maybeBoolean = this.localStorage.getBoolean('optionalFlag'); // boolean | null
    const maybeEnum = this.localStorage.getEnum<Theme>('optionalTheme', ['light', 'dark']); // Theme | null
  }
}
```

### Reactive Storage with Observables

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-reactive',
  template: `
    <div>Theme: {{ currentTheme }}</div>
    <button (click)="changeTheme()">Toggle Theme</button>
  `,
})
export class ReactiveComponent implements OnInit {
  private localStorage = inject(LocalStorageService);
  currentTheme = 'light';

  ngOnInit() {
    // Watch changes to a specific key
    this.localStorage.watch('theme').subscribe(value => {
      this.currentTheme = value ?? 'light';
      console.log('Theme changed to:', value);
    });
    
    // Watch all storage changes
    this.localStorage.watchAll().subscribe(event => {
      console.log('Storage changed:', event.key, event.newValue);
    });
  }

  changeTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.localStorage.set('theme', newTheme);
    // Observable will automatically emit the new value
  }
}
```

### Reactive & Advanced Features

```typescript
@Component({ selector: 'app-advanced' })
export class AdvancedComponent implements OnInit {
  private localStorage = inject(LocalStorageService);

  ngOnInit() {
    // Watch changes to specific key
    this.localStorage.watch('theme').subscribe(value => {
      console.log('Theme changed:', value);
    });
  }

  examples() {
    // Get with default (auto-sets if missing)
    const theme = this.localStorage.getWithDefault('theme', 'light', ['light', 'dark']);

    // Conditional set
    this.localStorage.setIfNotExists('firstVisit', new Date().toISOString());

    // Bulk operations
    this.localStorage.multiSet({ username: 'john', theme: 'dark' });
    const values = this.localStorage.multiGet(['username', 'theme']);

    // Delete operations
    this.localStorage.deleteMany(['key1', 'key2']);
    this.localStorage.clear();

    // Storage info
    const size = this.localStorage.size();
  }
}
```

## 📚 API Reference

### Basic Methods
| Method | Description |
|--------|-------------|
| `set(key: string, value: string, skipEncoding?: boolean): void` | Store a string value |
| `get(key: string, skipDecoding?: boolean): string \| null` | Get a string value |
| `delete(key: string): void` | Remove an item |
| `has(key: string): boolean` | Check if key exists |
| `clear(): void` | Remove all items |
| `keys(): string[]` | Get all keys |
| `values(): (string \| null)[]` | Get all values |
| `entries(): [string, string \| null][]` | Get all key-value pairs |

### Core Methods

| Method | Description |
|--------|-------------|
| `setJson<T>(key, value): void` | Store JSON value |
| `getJson<T>(key, skipDecoding?): T \| null` | Get and parse JSON |
| `getJsonWithDefault<T>(key, defaultValue): T` | Get JSON with auto-set default |
| `setArray<T>(key, value): void` | Store array |
| `getArray<T>(key, skipDecoding?): T[] \| null` | Get and parse array |
| `getArrayWithDefault<T>(key, defaultValue?): T[]` | Get array with auto-set default |
| `getBoolean(key, skipDecoding?)` | Parse boolean |
| `getBooleanWithDefault(key, defaultValue)` | Parse boolean with auto-set default |
| `getNumber(key, skipDecoding?)` | Parse number |
| `getNumberWithDefault(key, defaultValue)` | Parse number with auto-set default |
| `getEnum<T>(key, enumValues, skipDecoding?)` | Get validated enum |
| `getEnumWithDefault<T>(key, defaultValue, enumValues)` | Get enum with auto-set default |

### Advanced

| Method | Description |
|--------|-------------|
| `setIfNotExists(key: string, value: string): void` | Set only if missing |
| `getWithDefault(key: string, defaultValue: string, allowedValues?: string[]): string` | Get with validation and auto-set default |
| `updateJson<T>(key: string, updates: Partial<T>, defaultValue: T): void` | Partial JSON update |
| `multiGet(keys: string[]): Map<string, string \| null>` | Get multiple values at once |
| `multiSet(entries: Record<string, string>): void` | Set multiple values at once |
| `deleteMany(keys: string[]): void` | Delete multiple keys |
| `watch(key: string): Observable<string \| null>` | Watch key changes |
| `watchAll(): Observable<{key: string \| null, oldValue: string \| null, newValue: string \| null}>` | Watch all changes |
| `size(): number` | Total size in bytes |

## 🎯 Use Case: Shopping Cart

```typescript
import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private localStorage = inject(LocalStorageService);
  private readonly CART_KEY = 'shopping-cart';

  getCart(): CartItem[] {
    return this.localStorage.getArrayWithDefault<CartItem>(this.CART_KEY, []);
  }

  addItem(item: CartItem) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === item.id);
    existing ? existing.quantity += item.quantity : cart.push(item);
    this.localStorage.setArray(this.CART_KEY, cart);
  }

  removeItem(itemId: number) {
    const cart = this.getCart().filter(i => i.id !== itemId);
    this.localStorage.setArray(this.CART_KEY, cart);
  }

  getTotalPrice(): number {
    return this.getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

## 📖 Documentation

Full documentation: [https://catbee.npm.hprasath.com/docs/@ng-catbee/storage](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/intro)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Web Storage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Storage Quota (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate)
- [Catbee Technologies](https://github.com/catbee-technologies)
