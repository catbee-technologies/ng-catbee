# @ng-catbee/cookie

## Catbee Cookie Service for Angular

> A modern, type-safe Angular library for managing browser cookies with ease — fully compatible with Server-Side Rendering (SSR) and offering advanced features like JSON storage, boolean parsing, and enum validation.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/cookie" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/cookie" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/cookie" alt="License" />
</div>

## 📦 Demo

- [Stackblitz](https://stackblitz.com/edit/ng-catbee-cookie?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🍪 **Simple & Intuitive API**: Easy-to-use methods for all cookie operations
- 🔒 **Type-Safe**: Full TypeScript support with generics
- 🎯 **Advanced Getters**: Built-in support for JSON, arrays, booleans, numbers, and enums
- 🔐 **Secure by Default**: Support for HttpOnly, Secure, and SameSite attributes
- 🌐 **SSR Compatible**: Gracefully handles server-side rendering without errors
- 📦 **Zero Dependencies**: Lightweight with no external dependencies

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |

This library is built and tested with Angular **20.x**, and supports all modern standalone-based Angular projects (v17+).

## 🛠️ Installation

```bash
npm install @ng-catbee/cookie --save
```

## 🔧 Configuration

### Standalone Applications (Recommended)

Use `provideCatbeeCookie` in your `app.config.ts` to configure global defaults for all cookies:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideCatbeeCookie } from '@ng-catbee/cookie';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeCookie({
      path: '/',          // Default path for all cookies
      expires: 7,         // Default expiration (7 days)
      secure: true,       // Enable secure flag by default
      sameSite: 'Lax',    // Default SameSite policy
      domain: 'example.com' // Optional: set cookie domain
    })
  ]
};
```

### Module-Based Applications

Use `CatbeeCookieModule.forRoot()` in your root module:

```typescript
import { NgModule } from '@angular/core';
import { CatbeeCookieModule } from '@ng-catbee/cookie';

@NgModule({
  imports: [
    CatbeeCookieModule.forRoot({
      path: '/',
      expires: 7,
      secure: true,
      sameSite: 'Lax'
    })
  ]
})
export class AppModule { }
```

> **Note**: Global configuration values serve as defaults and can be overridden per cookie operation by passing options directly to methods like `set()`, `setJson()`, etc.

## ⚡ Quick Start

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { CookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="saveCookie()">Save Cookie</button>
    <button (click)="getCookie()">Get Cookie</button>
    <button (click)="deleteCookie()">Delete Cookie</button>
    <p>Cookie Value: {{ cookieValue }}</p>
  `,
})
export class AppComponent {
  private cookieService = inject(CookieService);
  cookieValue = '';

  saveCookie() {
    // Uses global config + method-specific options
    this.cookieService.set('username', 'john_doe', {
      expires: 7 // 7 days (other options from global config)
    });
  }

  getCookie() {
    this.cookieValue = this.cookieService.get('username') || 'Not found';
  }

  deleteCookie() {
    this.cookieService.delete('username');
    this.cookieValue = '';
  }
}
```

### Working with JSON Objects

```typescript
import { Component, inject } from '@angular/core';
import { CookieService } from '@ng-catbee/cookie';

interface UserPreferences {
  theme: string;
  language: string;
  notifications: boolean;
}

@Component({
  selector: 'app-preferences',
  template: `<div>User preferences saved!</div>`,
})
export class PreferencesComponent {
  private cookieService = inject(CookieService);

  savePreferences() {
    const prefs: UserPreferences = {
      theme: 'dark',
      language: 'en',
      notifications: true
    };
    
    this.cookieService.setJson('userPrefs', prefs, { expires: 30 });
  }

  loadPreferences() {
    const defaultPrefs: UserPreferences = {
      theme: 'light',
      language: 'en',
      notifications: false
    };
    
    // Read-only: returns null if missing, doesn't set
    const prefs = this.cookieService.getJson<UserPreferences>('userPrefs');
    if (prefs) {
      console.log('User preferences:', prefs);
    }
  }

  loadPreferencesWithDefault() {
    const defaultPrefs: UserPreferences = {
      theme: 'light',
      language: 'en',
      notifications: false
    };
    
    // Auto-set: returns value or sets default if missing/invalid
    const prefs = this.cookieService.getJsonWithDefault('userPrefs', defaultPrefs, { expires: 30 });
    console.log('User preferences:', prefs);
  }

  updatePreferences() {
    const defaultPrefs: UserPreferences = {
      theme: 'light',
      language: 'en',
      notifications: false
    };
    
    // Partial update - only changes the theme
    this.cookieService.updateJson('userPrefs', { theme: 'dark' }, defaultPrefs);
  }
}
```

### Type-Safe Boolean & Number Cookies

```typescript
import { Component, inject } from '@angular/core';
import { CookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-settings',
  template: `<div>Settings saved!</div>`,
})
export class SettingsComponent {
  private cookieService = inject(CookieService);

  // Boolean cookies (recognizes: true/false, 1/0, yes/no, on/off)
  // Read-only: returns value or default, doesn't set
  checkAcceptedCookies() {
    const accepted = this.cookieService.getBoolean('cookiesAccepted');
    console.log('Cookies accepted:', accepted);
  }

  // Auto-set: returns value or sets and returns default
  ensureAcceptedCookies() {
    const accepted = this.cookieService.getBooleanWithDefault('cookiesAccepted', true, {
      expires: 365
    });
    console.log('Cookies accepted:', accepted); // true (and sets if missing)
  }

  // Number cookies - read-only
  getViewCount() {
    const count = this.cookieService.getNumber('viewCount');
    console.log('View count:', count);
  }

  // Number cookies - auto-set with increment
  incrementViewCount() {
    const count = this.cookieService.getNumberWithDefault('viewCount', 0);
    this.cookieService.set('viewCount', (count + 1).toString());
  }

  // Enum cookies with validation - read-only
  getTheme() {
    type Theme = 'light' | 'dark' | 'auto';
    const themes: readonly Theme[] = ['light', 'dark', 'auto'];
    const theme = this.cookieService.getEnum('theme', themes);
    console.log('Theme:', theme);
  }

  // Enum cookies - auto-set with validation
  ensureTheme() {
    type Theme = 'light' | 'dark' | 'auto';
    const themes: readonly Theme[] = ['light', 'dark', 'auto'];
    const theme = this.cookieService.getEnumWithDefault('theme', 'light', themes, {
      expires: 365
    });
    console.log('Theme:', theme); // Sets to 'light' if missing/invalid
  }
}
```

### Advanced Features

```typescript
import { Component, inject } from '@angular/core';
import { CookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-advanced',
  template: `<div>Advanced cookie operations</div>`,
})
export class AdvancedComponent {
  private cookieService = inject(CookieService);

  // Atomic get-or-set operation
  getOrCreateSessionId() {
    const sessionId = this.cookieService.getWithDefault('sessionId', this.generateId(), {
      expires: 1 // 1 day
    });
    console.log('Session ID:', sessionId);
  }

  // Get with default and validation
  getValidatedSetting() {
    const allowedValues = ['option1', 'option2', 'option3'];
    const setting = this.cookieService.getWithDefault(
      'userSetting',
      'option1',
      allowedValues
    );
    console.log('Setting:', setting);
  }

  // Conditional set
  setIfNotExists() {
    this.cookieService.setIfNotExists('firstVisit', new Date().toISOString());
  }

  // Working with arrays - read-only
  saveRecentItems() {
    const items = ['item1', 'item2', 'item3'];
    this.cookieService.setArray('recentItems', items);
    
    // Read-only: returns null if missing
    const retrieved = this.cookieService.getArray<string>('recentItems');
    if (retrieved) {
      console.log('Recent items:', retrieved);
    }
  }

  // Working with arrays - auto-set default
  getRecentItemsWithDefault() {
    // Auto-set: returns array or sets default if missing/invalid
    const items = this.cookieService.getArrayWithDefault('recentItems', ['default-item'], {
      expires: 7
    });
    console.log('Recent items:', items);
  }

  // Check existence
  checkCookie() {
    if (this.cookieService.has('username')) {
      console.log('User is logged in');
    }
  }

  // Get all cookies
  getAllCookies() {
    const allCookies = this.cookieService.getAll();
    console.log('All cookies:', allCookies);
  }

  // Get cookie names, values, or entries
  getCookieInfo() {
    const names = this.cookieService.keys();
    const values = this.cookieService.values();
    const entries = this.cookieService.entries();
    
    console.log('Names:', names);
    console.log('Values:', values);
    console.log('Entries:', entries);
  }

  // Delete multiple cookies
  clearUserData() {
    this.cookieService.deleteMany(['username', 'sessionId', 'preferences']);
  }

  // Clear all cookies
  clearAll() {
    this.cookieService.deleteAll();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

## 📚 API Reference

### Understanding Read-Only vs Auto-Set Methods

The library provides two patterns for getter methods:

- **Read-Only Methods** (e.g., `getJson`, `getArray`, `getBoolean`, `getNumber`, `getEnum`): Return the cookie value if it exists and is valid, otherwise return a default value (`null`, `false`, or `NaN` depending on the method). They **never modify** cookies.
  
- **Auto-Set Methods** (e.g., `getJsonWithDefault`, `getArrayWithDefault`, `getBooleanWithDefault`, `getNumberWithDefault`, `getEnumWithDefault`): Return the cookie value if it exists and is valid. If missing or invalid, they **automatically set** the cookie to the default value before returning it.

```typescript
// Read-only: doesn't modify cookies
const prefs = cookieService.getJson<UserPrefs>('preferences');
// Returns null if missing, but doesn't set the cookie

const theme = cookieService.getEnum('theme', ['light', 'dark']);
// Returns null if missing, but doesn't set the cookie

// Auto-set: ensures cookie exists
const prefs = cookieService.getJsonWithDefault('preferences', { theme: 'light' }, {
  expires: 365
});
// Returns preferences AND sets the cookie if it was missing/invalid

const theme = cookieService.getEnumWithDefault('theme', 'light', ['light', 'dark'], {
  expires: 365
});
// Returns 'light' AND sets the cookie if it was missing/invalid
```

### Basic Methods

| Method | Description |
|--------|-------------|
| `set(name: string, value: string, options?: CookieOptions)` | Set a cookie with optional configuration |
| `get(name: string)` | Get a cookie value |
| `delete(name: string, options?: CookieOptions)` | Delete a cookie |
| `has(name: string)` | Check if a cookie exists |
| `deleteAll(options?: CookieOptions)` | Delete all cookies |
### Type-Safe Getters

| Method | Description |
|--------|-------------|
| `getJson<T>(name: string)` | Get and parse JSON cookie (read-only, returns null if missing) |
| `getJsonWithDefault<T>(name: string, defaultValue: T, options?: CookieOptions)` | Get JSON, auto-set if missing/invalid |
| `setJson<T>(name: string, value: T, options?: CookieOptions)` | Store JSON-serializable value |
| `getArray<T>(name: string)` | Get and parse array cookie (read-only, returns null if missing) |
| `getArrayWithDefault<T>(name: string, defaultValue: T[], options?: CookieOptions)` | Get array, auto-set if missing/invalid |
| `setArray<T>(name: string, value: T[], options?: CookieOptions)` | Store array value |
| `getBoolean(name: string)` | Parse boolean cookie (read-only, returns false if missing) |
| `getBooleanWithDefault(name: string, defaultValue: boolean, options?: CookieOptions)` | Parse boolean, auto-set if missing/invalid |
| `getNumber(name: string)` | Parse numeric cookie (read-only, returns NaN if missing) |
| `getNumberWithDefault(name: string, defaultValue: number, options?: CookieOptions)` | Parse number, auto-set if missing/invalid |
| `getEnum<T>(name: string, enumValues: readonly T[])` | Get validated enum value (read-only, returns null if missing) |
| `getEnumWithDefault<T>(name: string, defaultValue: T, enumValues: readonly T[], options?: CookieOptions)` | Get enum, auto-set if missing/invalid |

### Advanced Methods

| Method | Description |
|--------|-------------|
| `setIfNotExists(name: string, value: string, options?: CookieOptions)` | Set cookie only if it doesn't exist |
| `getWithDefault(name: string, defaultValue: string, allowedValues?: readonly string[], options?: CookieOptions)` | Get with validation and default |
| `updateJson<T>(name: string, updates: Partial<T>, defaultValue: T, options?: CookieOptions)` | Partial update of JSON cookie |
| `getAll()` | Get all cookies as object |
| `keys()` | Get all cookie names |
| `values()` | Get all cookie values |
| `entries()` | Get all cookies as key-value tuples |
| `deleteMany(names: string[], options?: CookieOptions)` | Delete multiple cookies at once |

### Cookie Options

```typescript
interface CookieOptions {
  expires?: Date | number;  // Expiration date or days from now
  path?: string;            // Cookie path (default: '/')
  domain?: string;          // Cookie domain (default: current domain)
  secure?: boolean;         // HTTPS only (default: false)
  sameSite?: 'Lax' | 'Strict' | 'None'; // CSRF protection (default: 'Lax')
  partitioned?: boolean;    // Partitioned cookie (CHIPS)
}
```

### Configuration Priority

Options are resolved in the following order (highest to lowest priority):

1. **Method-level options** - Options passed directly to `set()`, `setJson()`, etc.
2. **Global configuration** - Defaults set via `provideCatbeeCookie()` or `CatbeeCookieModule.forRoot()`
3. **Built-in defaults** - Library defaults (path: '/', sameSite: 'Lax', secure: false)

```typescript
// Example showing configuration priority
// Global config: { path: '/app', secure: true, expires: 7 }

// This uses global defaults
cookieService.set('key1', 'value1');
// Result: path='/app', secure=true, expires=7 days

// This overrides specific options
cookieService.set('key2', 'value2', { path: '/custom', expires: 30 });
// Result: path='/custom', secure=true (from global), expires=30 days

// This completely overrides global config
cookieService.set('key3', 'value3', { path: '/', secure: false, expires: 1 });
// Result: path='/', secure=false, expires=1 day
```

## 🔒 Security Best Practices

```typescript
// Use Secure flag for sensitive data
cookieService.set('authToken', token, {
  secure: true,       // HTTPS only
  sameSite: 'Strict', // CSRF protection
  expires: 7         // 7 days in days
});

// Validate cookie values with getWithDefault
const allowedThemes = ['light', 'dark'];
const theme = cookieService.getWithDefault('theme', 'light', allowedThemes);

// Use enum validation for type safety with auto-set
type Status = 'active' | 'inactive' | 'pending';
const statuses: readonly Status[] = ['active', 'inactive', 'pending'];
const status = cookieService.getEnumWithDefault('status', 'pending', statuses, {
  expires: 30 // 30 days in days
});
```

## 🌐 SSR Compatibility

The service gracefully handles Server-Side Rendering:

```typescript
import { inject } from '@angular/core';
import { SsrCookieService } from '@ng-catbee/cookie';

// Use SsrCookieService in SSR contexts
const ssrCookieService = inject(SsrCookieService);
const value = ssrCookieService.get('theme');

```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/intro)

- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/intro)
- [Installation](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/installation)
- [Basic Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/usage/basic)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/api-reference)
- [Type Definitions](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/types)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [Angular Documentation](https://angular.io/)
- [HTTP Cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
- [Cookie Store API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)
- [Catbee Technologies](https://github.com/catbee-technologies)
