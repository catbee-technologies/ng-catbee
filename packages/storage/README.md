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

## ✨ Features

- 🔒 **Type-Safe**: Full TypeScript support with generics for all operations
- 📦 **Dual Storage**: Separate services for localStorage and sessionStorage
- 🎯 **Advanced Getters**: Built-in support for JSON, arrays, booleans, numbers, and enums
- 🔄 **Reactive**: Observable-based change detection with RxJS
- 🌐 **SSR Compatible**: Gracefully handles server-side rendering without errors
- 🎨 **Configurable Encoding**: Choose from URI, Base64, custom, or no encoding
- ⚡ **Bulk Operations**: Get/set multiple items at once
- 🔐 **Atomic Operations**: Get-or-set, conditional updates, and more
- 📊 **Storage Info**: Monitor size, available space, and quota
- 📦 **Zero Dependencies**: Lightweight with no external dependencies (except Angular)

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |
| `v20` & `v21`   | ✅ v21 release fully supports both Angular 20 and Angular 21 |

This library is built and tested with Angular **21.x**, and supports all modern standalone-based Angular projects (v17+).

## 🛠️ Installation

```bash
npm install @ng-catbee/storage --save
```

## ⚡ Quick Start

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService, SessionStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="saveData()">Save Data</button>
    <button (click)="loadData()">Load Data</button>
    <p>{{ data }}</p>
  `,
})
export class AppComponent {
  private localStorage = inject(LocalStorageService);
  private sessionStorage = inject(SessionStorageService);
  data = '';

  saveData() {
    // Store in localStorage (persists across sessions)
    this.localStorage.set('username', 'john_doe');
    this.localStorage.set('theme', 'dark');
    
    // Store in sessionStorage (cleared when tab closes)
    this.sessionStorage.set('tempToken', 'abc123');
  }

  loadData() {
    const username = this.localStorage.get('username') ?? 'Guest';
    const theme = this.localStorage.get('theme') ?? 'light';
    const token = this.sessionStorage.get('tempToken') ?? 'No token';
    
    this.data = `User: ${username}, Theme: ${theme}, Token: ${token}`;
  }
}
```

### Working with JSON Objects

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

interface UserSettings {
  theme: string;
  language: string;
  notifications: boolean;
  fontSize: number;
}

@Component({
  selector: 'app-settings',
  template: `<div>User settings saved!</div>`,
})
export class SettingsComponent {
  private localStorage = inject(LocalStorageService);

  saveSettings() {
    const settings: UserSettings = {
      theme: 'dark',
      language: 'en',
      notifications: true,
      fontSize: 14
    };
    
    this.localStorage.setJson('userSettings', settings);
  }

  loadSettings() {
    const defaultSettings: UserSettings = {
      theme: 'light',
      language: 'en',
      notifications: false,
      fontSize: 12
    };
    
    const settings = this.localStorage.getJson<UserSettings>('userSettings', defaultSettings);
    console.log('User settings:', settings);
  }

  updateSettings() {
    const defaultSettings: UserSettings = {
      theme: 'light',
      language: 'en',
      notifications: false,
      fontSize: 12
    };
    
    // Partial update - only changes theme and fontSize
    this.localStorage.updateJson('userSettings', { 
      theme: 'dark', 
      fontSize: 16 
    }, defaultSettings);
  }
}
```

### Type-Safe Boolean, Number, and Enum Values

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-typed',
  template: `<div>Type-safe storage!</div>`,
})
export class TypedComponent {
  private localStorage = inject(LocalStorageService);

  // Boolean values (recognizes: true/false, 1/0, yes/no, on/off)
  saveBooleans() {
    this.localStorage.set('darkMode', 'true');
    const isDark = this.localStorage.getBoolean('darkMode', false);
    console.log('Dark mode:', isDark); // true
  }

  // Number values
  saveNumbers() {
    this.localStorage.set('count', '42');
    const count = this.localStorage.getNumber('count', 0);
    console.log('Count:', count); // 42 (as number)
    
    // Handles floats
    this.localStorage.set('price', '19.99');
    const price = this.localStorage.getNumber('price', 0);
    console.log('Price:', price); // 19.99
  }

  // Enum values with validation
  saveEnum() {
    type Theme = 'light' | 'dark' | 'auto';
    const themes: readonly Theme[] = ['light', 'dark', 'auto'];
    
    this.localStorage.set('theme', 'dark');
    const theme = this.localStorage.getEnum('theme', 'light', themes);
    console.log('Theme:', theme); // 'dark'
    
    // Invalid value returns default
    this.localStorage.set('theme', 'rainbow');
    const validated = this.localStorage.getEnum('theme', 'light', themes);
    console.log('Validated:', validated); // 'light' (default)
  }
}
```

### Working with Arrays

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-arrays',
  template: `<div>Array storage demo</div>`,
})
export class ArraysComponent {
  private localStorage = inject(LocalStorageService);

  saveArrays() {
    // Simple arrays
    const tags = ['angular', 'typescript', 'rxjs'];
    this.localStorage.setArray('tags', tags);
    
    // Complex object arrays
    const todos = [
      { id: 1, text: 'Learn Angular', done: true },
      { id: 2, text: 'Build app', done: false }
    ];
    this.localStorage.setArray('todos', todos);
  }

  loadArrays() {
    const tags = this.localStorage.getArray<string>('tags', []);
    console.log('Tags:', tags);
    
    const todos = this.localStorage.getArray<{id: number, text: string, done: boolean}>('todos', []);
    console.log('Todos:', todos);
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
    // Observe changes to a specific key
    this.localStorage.observe('theme').subscribe(value => {
      this.currentTheme = value ?? 'light';
      console.log('Theme changed to:', value);
    });
    
    // Observe all storage changes
    this.localStorage.observeAll().subscribe(event => {
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

### Advanced Operations

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-advanced',
  template: `<div>Advanced storage operations</div>`,
})
export class AdvancedComponent {
  private localStorage = inject(LocalStorageService);

  // Atomic get-or-set operation
  getOrCreateUserId() {
    const userId = this.localStorage.getOrSet('userId', this.generateId());
    console.log('User ID:', userId);
  }

  // Get with default and validation
  getValidatedSetting() {
    const allowedSizes = ['small', 'medium', 'large'];
    const size = this.localStorage.getWithDefault('size', 'medium', allowedSizes);
    console.log('Size:', size);
  }

  // Conditional set
  setIfNotExists() {
    this.localStorage.setIfNotExists('firstVisit', new Date().toISOString());
  }

  // Bulk operations
  bulkOperations() {
    // Get multiple values at once
    const keys = ['username', 'email', 'theme'];
    const values = this.localStorage.multiGet(keys);
    values.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    
    // Set multiple values at once
    this.localStorage.multiSet({
      username: 'john',
      email: 'john@example.com',
      theme: 'dark'
    });
  }

  // Check existence
  checkKey() {
    if (this.localStorage.has('username')) {
      console.log('User is logged in');
    }
  }

  // Get all keys and values
  getAllData() {
    const keys = this.localStorage.keys();
    const values = this.localStorage.values();
    const entries = this.localStorage.entries();
    
    console.log('Keys:', keys);
    console.log('Values:', values);
    console.log('Entries:', entries);
  }

  // Delete operations
  deleteData() {
    // Delete single item
    this.localStorage.remove('tempData');
    
    // Delete multiple items
    this.localStorage.removeMany(['key1', 'key2', 'key3']);
    
    // Clear all
    this.localStorage.clear();
  }

  // Storage information
  getStorageInfo() {
    const length = this.localStorage.length;
    const size = this.localStorage.getSize();
    const available = this.localStorage.getAvailableSpace();
    
    console.log('Items count:', length);
    console.log('Size (bytes):', size);
    console.log('Available space:', available);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

### Module Configuration (Optional)

Configure encoding strategies globally:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideCatbeeStorage } from '@ng-catbee/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeStorage({
      // Apply to both localStorage and sessionStorage
      common: {
        encoding: 'base64' // 'default' (URI), 'base64', 'custom', or 'none'
      }
    })
  ]
};
```

Different configurations for each storage:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeStorage({
      localStorage: {
        encoding: 'base64'
      },
      sessionStorage: {
        encoding: 'default'
      }
    })
  ]
};
```

Custom encoding/decoding:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeStorage({
      common: {
        encoding: 'custom',
        customEncode: (value: string) => btoa(value),
        customDecode: (value: string) => atob(value)
      }
    })
  ]
};
```

## 📚 API Reference

### Common Methods (Both LocalStorage & SessionStorage)

| Method | Description |
|--------|-------------|
| `set(key, value, skipEncoding?)` | Store a string value |
| `get(key, skipDecoding?)` | Get a string value |
| `remove(key)` | Remove an item |
| `has(key)` | Check if key exists |
| `clear()` | Remove all items |
| `keys()` | Get all keys |
| `values()` | Get all values |
| `entries()` | Get all key-value pairs |

### Type-Safe Getters

| Method | Description |
|--------|-------------|
| `getJson<T>(key, defaultValue)` | Get and parse JSON value |
| `setJson<T>(key, value)` | Store JSON-serializable value |
| `getArray<T>(key, defaultValue?)` | Get and parse array |
| `setArray<T>(key, value)` | Store array value |
| `getBoolean(key, defaultValue)` | Parse boolean value |
| `getNumber(key, defaultValue)` | Parse numeric value |
| `getEnum<T>(key, defaultValue, enumValues)` | Get validated enum value |

### Advanced Methods

| Method | Description |
|--------|-------------|
| `setIfNotExists(key, value)` | Set only if key doesn't exist |
| `getOrSet(key, defaultValue)` | Get or set default atomically |
| `getWithDefault(key, defaultValue, allowedValues?)` | Get with validation |
| `updateJson<T>(key, updates, defaultValue)` | Partial JSON update |
| `multiGet(keys)` | Get multiple values at once |
| `multiSet(entries)` | Set multiple values at once |
| `removeMany(keys)` | Remove multiple keys |

### Reactive Methods

| Method | Description |
|--------|-------------|
| `observe(key)` | Observe changes to a specific key |
| `observeAll()` | Observe all storage changes |

### Storage Info

| Property/Method | Description |
|-----------------|-------------|
| `length` | Number of stored items |
| `getSize()` | Total size in bytes |
| `getAvailableSpace()` | Available storage space |

## 🔒 Storage Quota Information

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

@Component({
  selector: 'app-quota',
  template: `<div>Storage: {{ usedSpace }} / {{ totalSpace }}</div>`,
})
export class QuotaComponent implements OnInit {
  private localStorage = inject(LocalStorageService);
  usedSpace = '';
  totalSpace = '';

  ngOnInit() {
    const size = this.localStorage.getSize();
    const available = this.localStorage.getAvailableSpace();
    
    this.usedSpace = this.formatBytes(size);
    this.totalSpace = available !== null 
      ? this.formatBytes(size + available) 
      : 'Unknown';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
```

## 🌐 SSR Compatibility

Both services gracefully handle Server-Side Rendering:

```typescript
// All methods are safe to call during SSR
const value = localStorage.get('theme'); // Returns null on server
localStorage.set('theme', 'dark'); // No-op on server

// No need for platform checks!
```

## 🎯 Common Use Cases

### User Preferences

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { LocalStorageService } from '@ng-catbee/storage';

interface UserPrefs {
  theme: 'light' | 'dark';
  language: string;
  fontSize: number;
}

@Component({
  selector: 'app-preferences',
  template: `<div>Preferences loaded</div>`,
})
export class PreferencesComponent implements OnInit {
  private localStorage = inject(LocalStorageService);

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    const prefs = this.localStorage.getJson<UserPrefs>('preferences', {
      theme: 'light',
      language: 'en',
      fontSize: 14
    });
    
    this.applyPreferences(prefs);
  }

  savePreference(key: keyof UserPrefs, value: any) {
    this.localStorage.updateJson('preferences', { [key]: value }, {
      theme: 'light',
      language: 'en',
      fontSize: 14
    });
  }

  private applyPreferences(prefs: UserPrefs) {
    // Apply preferences to app
  }
}
```

### Shopping Cart

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
    return this.localStorage.getArray<CartItem>(this.CART_KEY, []);
  }

  addItem(item: CartItem) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === item.id);
    
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push(item);
    }
    
    this.localStorage.setArray(this.CART_KEY, cart);
  }

  removeItem(itemId: number) {
    const cart = this.getCart().filter(i => i.id !== itemId);
    this.localStorage.setArray(this.CART_KEY, cart);
  }

  clearCart() {
    this.localStorage.remove(this.CART_KEY);
  }

  getTotalPrice(): number {
    return this.getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
```

### Form State Persistence

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { LocalStorageService } from '@ng-catbee/storage';
import { debounceTime } from 'rxjs/operators';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-form',
  template: `
    <form [formGroup]="form">
      <input formControlName="name" />
      <textarea formControlName="message"></textarea>
    </form>
  `,
})
export class FormComponent implements OnInit, OnDestroy {
  private localStorage = inject(LocalStorageService);
  private destroy$ = new Subject<void>();
  
  form = new FormGroup({
    name: new FormControl(''),
    message: new FormControl('')
  });

  ngOnInit() {
    // Restore form state
    const saved = this.localStorage.getJson('draftForm', null);
    if (saved) {
      this.form.patchValue(saved);
    }

    // Auto-save on changes
    this.form.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.localStorage.setJson('draftForm', value);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm() {
    // Clear draft after successful submit
    this.localStorage.remove('draftForm');
  }
}
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/intro)

- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/intro)
- [Installation](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/installation)
- [Basic Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/usage/basic)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/api-reference)
- [Type Definitions](https://catbee.npm.hprasath.com/docs/@ng-catbee/storage/types)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Angular Documentation](https://angular.io/)
- [Web Storage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Storage Quota (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate)
- [Catbee Technologies](https://github.com/catbee-technologies)
