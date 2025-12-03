# @ng-catbee/cookie

## Catbee Cookie Service for Angular

> A modern, type-safe Angular library for managing browser cookies with ease — fully compatible with Server-Side Rendering (SSR) and offering advanced features like JSON storage, boolean/number parsing, and enum validation.

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

[Stackblitz](https://stackblitz.com/edit/ng-catbee-cookie?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🍪 **Simple & Intuitive API** - Easy-to-use methods for all cookie operations
- 🔒 **Type-Safe** - Full TypeScript support with generics
- 🎯 **Advanced Getters** - Built-in support for JSON, arrays, booleans, numbers, and enums
- 🔐 **Secure by Default** - Support for Secure and SameSite attributes
- 🌐 **SSR Compatible** - Gracefully handles server-side rendering
- 📦 **Zero Dependencies** - Lightweight with no external dependencies

## 🛠️ Installation

```bash
npm install @ng-catbee/cookie
```

## 🔧 Configuration (Optional)

**Standalone apps:**
```typescript
import { provideCatbeeCookie } from '@ng-catbee/cookie';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeCookie({
      path: '/',
      secure: true,
      sameSite: 'Lax',
    })
  ]
};
```

**Module-based apps:**
```typescript
import { CatbeeCookieModule } from '@ng-catbee/cookie';

@NgModule({
  imports: [
    CatbeeCookieModule.forRoot({
      path: '/',
      secure: true,
      sameSite: 'Lax'
    })
  ]
})
export class AppModule { }
```

> Global configuration sets defaults. Override per-method by passing `options`.

## ⚡ Quick Start

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeCookieService, CatbeeSsrCookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="save()">Save</button>
    <button (click)="load()">Load</button>
    <p>{{ value }}</p>
  `
})
export class AppComponent {
  private cookieService = inject(CatbeeCookieService);

  /*
   * It only provides getting cookies from the request headers in SSR context
   * and does not support setting cookies.
   */
  private ssrCookieService = inject(CatbeeSsrCookieService);

  value = '';

  save() {
    this.cookieService.set('username', 'john_doe', { expires: 7 });
  }

  load() {
    this.value = this.cookieService.get('username') || 'Not found';
  }
}
```

### JSON & Type-Safe Methods

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeCookieService } from '@ng-catbee/cookie';

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
  private cookieService = inject(CatbeeCookieService);

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
import { CatbeeCookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-settings',
  template: `<div>Settings saved!</div>`,
})
export class SettingsComponent {
  private cookieService = inject(CatbeeCookieService);

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
import { CatbeeCookieService } from '@ng-catbee/cookie';

@Component({
  selector: 'app-advanced',
  template: `<div>Advanced cookie operations</div>`,
})
export class AdvancedComponent {
  private cookieService = inject(CatbeeCookieService);

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

### Basic Methods

| Method | Description |
|--------|-------------|
| `set(name: string, value: string, options?: CookieOptions): void` | Set a cookie with optional configuration |
| `get(name: string): string \| null` | Get a cookie value |
| `delete(name: string, options?: CookieOptions): void` | Delete a cookie |
| `has(name: string): boolean` | Check if a cookie exists |
| `deleteAll(options?: CookieOptions): void` | Delete all cookies |
### Type-Safe Getters

| Method | Description |
|--------|-------------|
| `setJson<T>(name: string, value: T, options?: CookieOptions): void` | Store JSON-serializable value |
| `getJson<T>(name: string): T \| null` | Get and parse JSON cookie (read-only, returns null if missing) |
| `getJsonWithDefault<T>(name: string, defaultValue: T, options?: CookieOptions): T` | Get JSON, auto-set if missing/invalid |
| `setArray<T>(name: string, value: T[], options?: CookieOptions): void` | Store array value |
| `getArray<T>(name: string): T[] \| null` | Get and parse array cookie (read-only, returns null if missing) |
| `getArrayWithDefault<T>(name: string, defaultValue: T[], options?: CookieOptions): T[]` | Get array, auto-set if missing/invalid |
| `getBoolean(name: string): boolean` | Parse boolean cookie (read-only, returns false if missing) |
| `getBooleanWithDefault(name: string, defaultValue: boolean, options?: CookieOptions): boolean` | Parse boolean, auto-set if missing/invalid |
| `getNumber(name: string): number` | Parse numeric cookie (read-only, returns NaN if missing) |
| `getNumberWithDefault(name: string, defaultValue: number, options?: CookieOptions): number` | Parse number, auto-set if missing/invalid |
| `getEnum<T>(name: string, enumValues: readonly T[]): T \| null` | Get validated enum value (read-only, returns null if missing) |
| `getEnumWithDefault<T>(name: string, defaultValue: T, enumValues: readonly T[], options?: CookieOptions): T` | Get enum, auto-set if missing/invalid |

### Advanced Methods

| Method | Description |
|--------|-------------|
| `setIfNotExists(name: string, value: string, options?: CookieOptions): void` | Set cookie only if it doesn't exist |
| `getWithDefault(name: string, defaultValue: string, allowedValues?: readonly string[], options?: CookieOptions): string` | Get with validation and default |
| `updateJson<T>(name: string, updates: Partial<T>, defaultValue: T, options?: CookieOptions): void` | Partial update of JSON cookie |
| `getAll(): Record<string, string>` | Get all cookies as object |
| `keys(): string[]` | Get all cookie names |
| `values(): string[]` | Get all cookie values |
| `entries(): [string, string][]` | Get all cookies as key-value tuples |
| `deleteMany(names: string[], options?: CookieOptions): void` | Delete multiple cookies at once |

### Cookie Options

```typescript
interface CookieOptions {
  expires?: Date | number;  // Expiration date or days from now
  path?: string;            // Cookie path (default: '/')
  domain?: string;          // Cookie domain (default: current domain)
  secure?: boolean;         // HTTPS only (default: false)
  sameSite?: 'Lax' | 'Strict' | 'None'; // CSRF protection (default: 'Lax')
  partitioned?: boolean;    // Partitioned cookie (CHIPS)
  priority?: 'Low' | 'Medium' | 'High'; // Cookie priority (Chrome)
}
```

**Configuration Priority:** Method options > Global config > Built-in defaults

## 🏗️ CookieBuilder API

For advanced cookie string generation, use the `CookieBuilder` fluent API:

```typescript
import { CookieBuilder } from '@ng-catbee/cookie';

// Create a complete cookie string
const cookieString = CookieBuilder
  .create('session', 'abc123')
  .withExpires(3600000) // 1 hour in milliseconds
  .withPath('/')
  .withSecure()
  .withHttpOnly()
  .withSameSite('Strict')
  .withMaxAge(3600) // 1 hour in seconds
  .build();

// Result: "session=abc123; Expires=...; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Strict"
```

### CookieBuilder Methods

| Method | Description | Example |
|--------|-------------|---------|
| `create(name, value?, encoding?)` | Creates a new builder | `CookieBuilder.create('user', 'john')` |
| `withName(name)` | Sets cookie name | `.withName('session')` |
| `withValue(value)` | Sets cookie value | `.withValue('token123')` |
| `withExpires(date \| ms)` | Sets expiration (Date or ms from now) | `.withExpires(86400000)` |
| `withMaxAge(seconds)` | Sets Max-Age in seconds | `.withMaxAge(3600)` |
| `withDomain(domain)` | Sets Domain attribute | `.withDomain('.example.com')` |
| `withPath(path)` | Sets Path attribute | `.withPath('/app')` |
| `withSecure(bool?)` | Sets Secure flag | `.withSecure()` |
| `withHttpOnly(bool?)` | Sets HttpOnly flag | `.withHttpOnly()` |
| `withSameSite(mode)` | Sets SameSite attribute | `.withSameSite('Strict')` |
| `withPartitioned(bool?)` | Sets Partitioned flag (CHIPS) | `.withPartitioned()` |
| `withPriority(priority)` | Sets Priority (Chrome) | `.withPriority('High')` |
| `build()` | Returns cookie string | `.build()` |
| `toString()` | Alias for build() | `.toString()` |

## 🔒 Security

```typescript
// Use secure flags for sensitive data
cookieService.set('authToken', token, {
  secure: true,
  sameSite: 'Strict',
  expires: 7
});

// Validate with enums
type Theme = 'light' | 'dark';
const theme = cookieService.getEnumWithDefault('theme', 'light', ['light', 'dark']);
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/intro/)

- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/intro/)
- [Installation and Configuration](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/installation/)
- [Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/usage/)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/cookie/api-reference/)

## 📜 License

MIT © Catbee Technologies

## 🔗 Links

- [HTTP Cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
- [Cookie Store API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API)
- [Catbee Technologies](https://github.com/catbee-technologies)
