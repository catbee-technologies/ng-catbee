# @ng-catbee/indexed-db

## Catbee IndexedDB for Angular

> A comprehensive, type-safe Angular library for IndexedDB operations — providing full CRUD functionality, advanced querying with indexes and cursors, bulk operations, database migrations, and reactive RxJS observables, all with Server-Side Rendering (SSR) support.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/indexed-db" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/indexed-db" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/indexed-db" alt="License" />
</div>

## ✨ Features

- 🔒 **Type-Safe**: Full TypeScript support with generics for all operations
- 📦 **Complete CRUD**: Create, Read, Update, Delete with single and bulk operations
- 🎯 **Advanced Queries**: Index-based queries, cursors, and key ranges
- 🔄 **Reactive**: RxJS observables for all operations
- 🌐 **SSR Compatible**: Gracefully handles server-side rendering
- 🗄️ **Migrations**: Built-in database versioning and migration support
- ⚡ **Bulk Operations**: Add, update, delete multiple records efficiently
- 📊 **Flexible Indexing**: Create and query custom indexes
- 🔍 **Cursor Support**: Iterate over large datasets efficiently
- 🎨 **Dynamic Stores**: Create and delete object stores at runtime
- 📈 **Database Info**: Get versions, store names, and counts
- 🚀 **Zero Config**: Works out of the box with simple configuration

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |
| `v20` & `v21`   | ✅ v21 release fully supports both Angular 20 and Angular 21 |

This library is built and tested with Angular **21.x**, and supports all modern standalone-based Angular projects (v17+).

## 🛠️ Installation

```bash
npm install @ng-catbee/indexed-db --save
```

## ⚡ Quick Start

### Configuration

Configure the database in your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeIndexedDB({
      name: 'MyAppDB',
      version: 1,
      objectStoresMeta: [
        {
          store: 'users',
          storeConfig: { keyPath: 'id', autoIncrement: true },
          storeSchema: [
            { name: 'email', keypath: 'email', options: { unique: true } },
            { name: 'name', keypath: 'name', options: { unique: false } },
            { name: 'role', keypath: 'role', options: { unique: false } }
          ]
        },
        {
          store: 'products',
          storeConfig: { keyPath: 'id', autoIncrement: true },
          storeSchema: [
            { name: 'sku', keypath: 'sku', options: { unique: true } },
            { name: 'category', keypath: 'category', options: { unique: false } },
            { name: 'price', keypath: 'price', options: { unique: false } }
          ]
        }
      ]
    })
  ]
};
```

### Basic CRUD Operations

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-users',
  template: `
    <div>
      <h2>Users</h2>
      <ul>
        <li *ngFor="let user of users">
          {{ user.name }} - {{ user.email }} ({{ user.role }})
        </li>
      </ul>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  private db = inject(CatbeeIndexedDBService);
  users: User[] = [];

  ngOnInit() {
    this.loadUsers();
  }

  // CREATE
  addUser() {
    const newUser: User = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    };

    this.db.add('users', newUser).subscribe(user => {
      console.log('User added:', user);
      this.loadUsers();
    });
  }

  // READ
  loadUsers() {
    this.db.getAll<User>('users').subscribe(users => {
      this.users = users;
    });
  }

  // UPDATE
  updateUser(userId: number) {
    const updatedUser: User = {
      id: userId,
      name: 'John Updated',
      email: 'john.updated@example.com',
      role: 'user'
    };

    this.db.update('users', updatedUser).subscribe(user => {
      console.log('User updated:', user);
      this.loadUsers();
    });
  }

  // DELETE
  deleteUser(userId: number) {
    this.db.deleteByKey('users', userId).subscribe(() => {
      console.log('User deleted');
      this.loadUsers();
    });
  }
}
```

### Querying by Index

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-search',
  template: `<div>Search component</div>`,
})
export class SearchComponent {
  private db = inject(CatbeeIndexedDBService);

  // Get user by email (using unique index)
  getUserByEmail(email: string) {
    this.db.getByIndex<User>('users', 'email', email)
      .subscribe(user => {
        console.log('Found user:', user);
      });
  }

  // Get all users with a specific role
  getUsersByRole(role: string) {
    this.db.getAllByIndex<User>('users', 'role', role)
      .subscribe(users => {
        console.log(`Users with role ${role}:`, users);
      });
  }

  // Get products by category
  getProductsByCategory(category: string) {
    this.db.getAllByIndex('products', 'category', category)
      .subscribe(products => {
        console.log('Products:', products);
      });
  }
}
```

### Bulk Operations

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-bulk',
  template: `<div>Bulk operations</div>`,
})
export class BulkComponent {
  private db = inject(CatbeeIndexedDBService);

  // Add multiple users at once
  bulkAddUsers() {
    const users = [
      { name: 'Alice', email: 'alice@example.com', role: 'user' },
      { name: 'Bob', email: 'bob@example.com', role: 'admin' },
      { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
    ];

    this.db.bulkAdd('users', users).subscribe(keys => {
      console.log('Added users with IDs:', keys);
    });
  }

  // Update multiple users
  bulkUpdateUsers() {
    const users = [
      { id: 1, name: 'Alice Updated', email: 'alice@example.com', role: 'admin' },
      { id: 2, name: 'Bob Updated', email: 'bob@example.com', role: 'user' }
    ];

    this.db.bulkPut('users', users).subscribe(lastKey => {
      console.log('Updated users, last key:', lastKey);
    });
  }

  // Get multiple users by IDs
  bulkGetUsers() {
    const userIds = [1, 2, 3];

    this.db.bulkGet<User>('users', userIds).subscribe(users => {
      console.log('Fetched users:', users);
    });
  }

  // Delete multiple users
  bulkDeleteUsers() {
    const userIds = [1, 2, 3];

    this.db.bulkDelete('users', userIds).subscribe(remaining => {
      console.log('Remaining items count:', remaining);
    });
  }
}
```

## 📚 API Reference

### Basic Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `add<T>(store, value, key?)` | Add a new entry | `Observable<T & WithID>` |
| `bulkAdd<T>(store, values)` | Add multiple entries | `Observable<number[]>` |
| `getByKey<T>(store, key)` | Get entry by key | `Observable<T>` |
| `getByID<T>(store, id)` | Get entry by ID | `Observable<T>` |
| `getAll<T>(store)` | Get all entries | `Observable<T[]>` |
| `bulkGet<T>(store, keys)` | Get multiple entries | `Observable<T[]>` |
| `update<T>(store, value)` | Update an entry | `Observable<T>` |
| `bulkPut<T>(store, items)` | Update multiple entries | `Observable<IDBValidKey>` |
| `deleteByKey(store, key)` | Delete entry by key | `Observable<void>` |
| `bulkDelete(store, keys)` | Delete multiple entries | `Observable<number[]>` |
| `delete<T>(store, query)` | Delete and return remaining | `Observable<T[]>` |
| `clear(store)` | Clear all entries | `Observable<void>` |
| `count(store, query?)` | Count entries | `Observable<number>` |

### Index Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `getByIndex<T>(store, index, key)` | Get entry by index | `Observable<T>` |
| `getAllByIndex<T>(store, index, query?, direction?)` | Get all by index | `Observable<T[]>` |
| `countByIndex(store, index, query?)` | Count by index | `Observable<number>` |
| `deleteAllByIndex(store, index, query?, direction?)` | Delete all by index | `Observable<void>` |
| `getAllKeysByIndex(store, index, query?, direction?)` | Get all keys by index | `Observable<IndexKey[]>` |

### Cursor Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `openCursor(options)` | Open cursor for iteration | `Observable<IDBCursorWithValue>` |
| `openCursorByIndex(options)` | Open cursor by index | `Observable<IDBCursorWithValue>` |

### Database Management

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize(config)` | Initialize database | `Observable<void>` |
| `getDatabaseVersion()` | Get database version | `Observable<number \| string>` |
| `deleteDatabase()` | Delete entire database | `Observable<void>` |
| `getAllObjectStoreNames()` | Get all store names | `Observable<string[]>` |
| `createObjectStore(schema, migrations?)` | Create new store | `Promise<void>` |
| `createDynamicObjectStore(schema, migrations?)` | Create store dynamically | `Promise<void>` |
| `deleteObjectStore(storeName)` | Delete object store | `Observable<void>` |

## 🎯 Common Use Cases

### Offline Data Storage

```typescript
import { Injectable, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private db = inject(CatbeeIndexedDBService);
  private http = inject(HttpClient);

  // Fetch articles from API and cache in IndexedDB
  getArticles() {
    return this.http.get<Article[]>('/api/articles').pipe(
      tap(articles => {
        // Cache in IndexedDB
        this.db.bulkAdd('articles', articles).subscribe();
      }),
      catchError(() => {
        // If offline, load from IndexedDB
        console.log('Offline mode: loading from cache');
        return this.db.getAll<Article>('articles');
      })
    );
  }

  // Get single article with offline support
  getArticle(id: number) {
    return this.http.get<Article>(`/api/articles/${id}`).pipe(
      tap(article => {
        // Update cache
        this.db.update('articles', article).subscribe();
      }),
      catchError(() => {
        // Load from cache if offline
        return this.db.getByID<Article>('articles', id);
      })
    );
  }

  // Save article (works offline)
  saveArticle(article: Article) {
    if (article.id) {
      return this.db.update('articles', article);
    } else {
      return this.db.add('articles', article);
    }
  }
}
```

### Form Draft Auto-Save

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { debounceTime, Subject, takeUntil } from 'rxjs';

interface FormDraft {
  id: string;
  formName: string;
  data: any;
  savedAt: string;
}

@Component({
  selector: 'app-form-with-autosave',
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
      <textarea formControlName="content" placeholder="Content"></textarea>
      <small *ngIf="lastSaved">Last saved: {{ lastSaved }}</small>
    </form>
  `,
})
export class FormWithAutosaveComponent implements OnInit, OnDestroy {
  private db = inject(CatbeeIndexedDBService);
  private destroy$ = new Subject<void>();
  
  form = new FormGroup({
    title: new FormControl(''),
    content: new FormControl('')
  });
  
  lastSaved = '';
  draftId = 'article-draft-1';

  ngOnInit() {
    // Load existing draft
    this.loadDraft();

    // Auto-save on changes
    this.form.valueChanges
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.saveDraft();
      });
  }

  loadDraft() {
    this.db.getByID<FormDraft>('drafts', this.draftId)
      .subscribe(draft => {
        if (draft) {
          this.form.patchValue(draft.data, { emitEvent: false });
          this.lastSaved = new Date(draft.savedAt).toLocaleString();
        }
      });
  }

  saveDraft() {
    const draft: FormDraft = {
      id: this.draftId,
      formName: 'article',
      data: this.form.value,
      savedAt: new Date().toISOString()
    };

    this.db.update('drafts', draft).subscribe(() => {
      this.lastSaved = new Date().toLocaleString();
    });
  }

  clearDraft() {
    this.db.deleteByKey('drafts', this.draftId).subscribe(() => {
      this.form.reset();
      this.lastSaved = '';
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Pagination with Cursors

```typescript
import { Component, inject, signal } from '@angular/core';
import { CatbeeIndexedDBService, DBMode } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-pagination',
  template: `
    <div>
      <div *ngFor="let item of currentPage()">
        {{ item.name }}
      </div>
      <button (click)="previousPage()" [disabled]="currentPageNum() === 0">Previous</button>
      <button (click)="nextPage()">Next</button>
      <span>Page {{ currentPageNum() + 1 }}</span>
    </div>
  `,
})
export class PaginationComponent {
  private db = inject(CatbeeIndexedDBService);
  
  currentPage = signal<any[]>([]);
  currentPageNum = signal(0);
  pageSize = 10;

  loadPage(pageNum: number) {
    let count = 0;
    const skip = pageNum * this.pageSize;
    const results: any[] = [];

    this.db.openCursor({
      storeName: 'users',
      mode: DBMode.readonly
    }).subscribe({
      next: (cursor) => {
        if (count >= skip && count < skip + this.pageSize) {
          results.push(cursor.value);
        }
        count++;
        cursor.continue();
      },
      complete: () => {
        this.currentPage.set(results);
        this.currentPageNum.set(pageNum);
      }
    });
  }

  nextPage() {
    this.loadPage(this.currentPageNum() + 1);
  }

  previousPage() {
    if (this.currentPageNum() > 0) {
      this.loadPage(this.currentPageNum() - 1);
    }
  }
}
```

### Search with Multiple Criteria

```typescript
import { Injectable, inject } from '@angular/core';
import { CatbeeIndexedDBService, DBMode } from '@ng-catbee/indexed-db';
import { Observable } from 'rxjs';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductSearchService {
  private db = inject(CatbeeIndexedDBService);

  // Search by category with price range
  searchProducts(category: string, minPrice: number, maxPrice: number): Observable<Product[]> {
    return new Observable(observer => {
      const results: Product[] = [];

      // First filter by category using index
      this.db.getAllByIndex<Product>('products', 'category', category)
        .subscribe(products => {
          // Then filter by price range
          const filtered = products.filter(p => 
            p.price >= minPrice && p.price <= maxPrice
          );
          observer.next(filtered);
          observer.complete();
        });
    });
  }

  // Advanced search with cursor
  advancedSearch(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): Observable<Product[]> {
    return new Observable(observer => {
      const results: Product[] = [];

      this.db.openCursor<Product>({
        storeName: 'products',
        mode: DBMode.readonly
      }).subscribe({
        next: (cursor) => {
          const product = cursor.value;
          let matches = true;

          if (filters.category && product.category !== filters.category) {
            matches = false;
          }
          if (filters.minPrice !== undefined && product.price < filters.minPrice) {
            matches = false;
          }
          if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
            matches = false;
          }
          if (filters.inStock !== undefined && product.inStock !== filters.inStock) {
            matches = false;
          }

          if (matches) {
            results.push(product);
          }

          cursor.continue();
        },
        complete: () => {
          observer.next(results);
          observer.complete();
        }
      });
    });
  }
}
```

### Database Migrations

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeIndexedDB({
      name: 'MyAppDB',
      version: 3, // Incremented version
      objectStoresMeta: [
        {
          store: 'users',
          storeConfig: { keyPath: 'id', autoIncrement: true },
          storeSchema: [
            { name: 'email', keypath: 'email', options: { unique: true } },
            { name: 'name', keypath: 'name', options: { unique: false } }
          ]
        }
      ],
      migrationFactory: () => ({
        // Migration from version 1 to 2
        2: (db, transaction) => {
          const userStore = transaction.objectStore('users');
          // Add new index
          if (!userStore.indexNames.contains('role')) {
            userStore.createIndex('role', 'role', { unique: false });
          }
        },
        // Migration from version 2 to 3
        3: (db, transaction) => {
          // Create new store
          if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { 
              keyPath: 'key' 
            });
            settingsStore.createIndex('category', 'category', { unique: false });
          }
        }
      })
    })
  ]
};
```

### Dynamic Store Creation

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-dynamic-store',
  template: `<button (click)="createUserStore()">Create User Store</button>`,
})
export class DynamicStoreComponent {
  private db = inject(CatbeeIndexedDBService);

  async createUserStore() {
    await this.db.createObjectStore({
      store: 'dynamic-users',
      storeConfig: { 
        keyPath: 'id', 
        autoIncrement: true 
      },
      storeSchema: [
        { name: 'username', keypath: 'username', options: { unique: true } },
        { name: 'email', keypath: 'email', options: { unique: true } },
        { name: 'createdAt', keypath: 'createdAt', options: { unique: false } }
      ]
    });

    console.log('Dynamic store created!');
  }

  async deleteStore() {
    this.db.deleteObjectStore('dynamic-users').subscribe(() => {
      console.log('Store deleted');
    });
  }

  listAllStores() {
    this.db.getAllObjectStoreNames().subscribe(names => {
      console.log('Available stores:', names);
    });
  }
}
```

### File Storage

```typescript
import { Injectable, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { Observable } from 'rxjs';

interface FileEntry {
  id?: number;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  uploadedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private db = inject(CatbeeIndexedDBService);

  saveFile(file: File): Observable<FileEntry & { id: number }> {
    const entry: FileEntry = {
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      uploadedAt: new Date().toISOString()
    };

    return this.db.add('files', entry);
  }

  getFile(id: number): Observable<FileEntry> {
    return this.db.getByID<FileEntry>('files', id);
  }

  getAllFiles(): Observable<FileEntry[]> {
    return this.db.getAll<FileEntry>('files');
  }

  deleteFile(id: number): Observable<void> {
    return this.db.deleteByKey('files', id);
  }

  getTotalSize(): Observable<number> {
    return new Observable(observer => {
      this.db.getAll<FileEntry>('files').subscribe(files => {
        const total = files.reduce((sum, file) => sum + file.size, 0);
        observer.next(total);
        observer.complete();
      });
    });
  }
}
```

## 🔍 Advanced Examples

### Transaction Safety

```typescript
import { Injectable, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private db = inject(CatbeeIndexedDBService);

  // Perform multiple operations atomically
  transferUserData(fromId: number, toId: number) {
    return forkJoin({
      fromUser: this.db.getByID('users', fromId),
      toUser: this.db.getByID('users', toId)
    }).pipe(
      switchMap(({ fromUser, toUser }) => {
        // Update both users
        return forkJoin({
          updated1: this.db.update('users', { ...fromUser, transferred: true }),
          updated2: this.db.update('users', { ...toUser, received: true })
        });
      })
    );
  }
}
```

### Database Statistics

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { forkJoin } from 'rxjs';

interface DBStats {
  version: number | string;
  stores: string[];
  counts: Record<string, number>;
  totalRecords: number;
}

@Component({
  selector: 'app-db-stats',
  template: `
    <div class="stats">
      <h3>Database Statistics</h3>
      <p>Version: {{ stats()?.version }}</p>
      <p>Total Records: {{ stats()?.totalRecords }}</p>
      <h4>Stores:</h4>
      <ul>
        <li *ngFor="let store of stats()?.stores">
          {{ store }}: {{ stats()?.counts[store] }} records
        </li>
      </ul>
    </div>
  `,
})
export class DbStatsComponent implements OnInit {
  private db = inject(CatbeeIndexedDBService);
  stats = signal<DBStats | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    forkJoin({
      version: this.db.getDatabaseVersion(),
      stores: this.db.getAllObjectStoreNames()
    }).subscribe(({ version, stores }) => {
      const countObservables = stores.reduce((acc, store) => {
        acc[store] = this.db.count(store);
        return acc;
      }, {} as Record<string, Observable<number>>);

      forkJoin(countObservables).subscribe(counts => {
        const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
        
        this.stats.set({
          version,
          stores,
          counts,
          totalRecords
        });
      });
    });
  }
}
```

## 🌐 SSR Compatibility

The service is fully compatible with Server-Side Rendering. All methods gracefully handle SSR:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-ssr-safe',
  template: `<div>SSR Safe Component</div>`,
})
export class SsrSafeComponent implements OnInit {
  private db = inject(CatbeeIndexedDBService);

  ngOnInit() {
    // Safe to call on both server and browser
    // On server, operations will no-op gracefully
    this.db.getAll('users').subscribe(users => {
      // Will be empty array on server
      console.log('Users:', users);
    });
  }
}
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.npm.hprasath.com](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/intro)

- [Introduction](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/intro)
- [Installation](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/installation)
- [Configuration](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/configuration)
- [Basic Usage](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/usage/basic)
- [Advanced Features](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/advanced)
- [API Reference](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/api-reference)
- [Migrations](https://catbee.npm.hprasath.com/docs/@ng-catbee/indexed-db/migrations)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Using IndexedDB (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Angular Documentation](https://angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Catbee Technologies](https://github.com/catbee-technologies)