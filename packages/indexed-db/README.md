# @ng-catbee/indexed-db

## Catbee IndexedDB for Angular

> A comprehensive, type-safe Angular library for IndexedDB operations — providing full CRUD functionality, advanced querying with indexes and cursors, bulk operations, database migrations, and reactive RxJS observables, SSR safe.

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/indexed-db" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/indexed-db" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2050" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/indexed-db" alt="License" />
</div>


## 📦 Demo

[Stackblitz](https://stackblitz.com/edit/ng-catbee-indexed-db?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🔒 **Type-Safe**: Full TypeScript support with generics for all operations
- 📦 **Complete CRUD**: Create, Read, Update, Delete with single and bulk operations
- 🎯 **Advanced Queries**: Query builder with filtering, sorting, and pagination
- 🔄 **Reactive**: RxJS observables for all operations
- 🗄️ **Migrations**: Built-in database versioning and migration support
- ⚡ **Bulk Operations**: Add, update, delete multiple records efficiently
- 📊 **Flexible Indexing**: Create and query custom indexes
- 🔍 **Cursor Support**: Iterate over large datasets efficiently
- 🎨 **Dynamic Stores**: Create and delete object stores at runtime
- 📈 **Database Info**: Get versions, store names, and counts
- 🚀 **Zero Config**: Works out of the box with simple configuration (browser-only, SSR-safe)
- 💾 **Transactions**: Atomic operations with rollback support
- 🎭 **Events**: Monitor all database changes in real-time
- ⚡ **Caching**: Built-in caching layer for improved performance
- 📤 **Export/Import**: Easy data backup and restore
- 🔧 **Error Handling**: Comprehensive error logging and recovery

## 🧩 Angular Compatibility

| Angular Version | Supported                                                    |
| --------------- | ------------------------------------------------------------ |
| `v17` and above | ✅ Fully supported                                           |

This library is built and tested with Angular **20.x**, and supports all modern standalone-based Angular projects (v17+).

## 🛠️ Installation

```bash
npm install @ng-catbee/indexed-db --save
```

## ⚡ Quick Start

### Configuration

**Standalone apps:**

Configure the database in your `app.config.ts`. The database will be automatically initialized when the service is first injected:

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
      ],
      cache: {
        enabled: true,
        expirySeconds: 300 // 5 minutes
      }
    })
  ]
};
```
**Module-based apps:**
```typescript
import { CatbeeIndexedDBModule } from '@ng-catbee/indexed-db';

@NgModule({
  imports: [
    CatbeeIndexedDBModule.forRoot({
      // configuration as above
    })
  ]
})
export class AppModule { }
```

**Note:** The database opens lazily on the first operation. You can also manually initialize it using the `initialize()` method if needed.

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

**Note:** The database opens lazily on the first operation. You can also manually initialize it using the `initialize()` method if needed.

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

### Exports

The library exports the following:

- `CatbeeIndexedDBService` - Main service class
- `QueryBuilder` - Query builder class
- `provideCatbeeIndexedDB` - Configuration provider function
- `DBMode` - Enum for transaction modes (`ReadOnly`, `ReadWrite`)
- Types: `CatbeeIndexedDBConfig`, `ObjectStoreMeta`, `ObjectStoreSchema`, `IndexDetails`, `WithID`, `IndexKey`, `CatbeeIDBCursor`, `CatbeeIDBCursorWithValue`, `DatabaseEvent`, `BatchOperation`, `QueryOperator`, `DatabaseState`

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
| `close()` | Close database connection | `void` |

### Advanced Operations (New!)

| Method | Description | Returns |
|--------|-------------|---------|
| `transaction<T>(store, mode, operations)` | Execute atomic transaction | `Observable<T>` |
| `query<T>(store)` | Create query builder | `QueryBuilder<T>` |
| `batch<T>(store, operations)` | Perform batch operations | `Observable<void>` |
| `export<T>(store)` | Export all data from store | `Observable<T[]>` |
| `import<T>(store, data)` | Import data into store | `Observable<void>` |
| `cached<T>(store, key, fetcher)` | Get cached or fetch data | `Observable<T>` |
| `invalidateCache(store?)` | Invalidate cache | `void` |

### Observables (New!)

| Property | Description | Type |
|----------|-------------|------|
| `events` | Database change events | `Observable<DatabaseEvent>` |
| `dbState` | Connection state | `Observable<DatabaseState>` |

## 🚀 New Advanced Features

### Query Builder

Build complex queries with filtering, sorting, and pagination:

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
}

interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-advanced-query',
  template: `<div>Advanced queries</div>`,
})
export class AdvancedQueryComponent {
  private db = inject(CatbeeIndexedDBService);

  searchUsers() {
    // Find admin users, sorted by name, limit to 10
    this.db.query<User>('users')
      .where('role', '=', 'admin')
      .orderBy('name', 'asc')
      .limit(10)
      .execute()
      .subscribe(users => {
        console.log('Admin users:', users);
      });
  }

  filterByPrice() {
    // Find products priced between $10 and $50
    this.db.query<Product>('products')
      .where('price', '>=', 10)
      .where('price', '<=', 50)
      .orderBy('price', 'desc')
      .execute()
      .subscribe(products => {
        console.log('Products:', products);
      });
  }

  paginatedResults() {
    // Get page 2 with 20 items per page
    this.db.query<User>('users')
      .orderBy('name', 'asc')
      .offset(20)
      .limit(20)
      .execute()
      .subscribe(users => {
        console.log('Page 2:', users);
      });
  }
}
```

### Atomic Transactions

Execute multiple operations atomically - all succeed or all fail:

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService, DBMode } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-transactions',
  template: `<div>Transactions</div>`,
})
export class TransactionsComponent {
  private db = inject(CatbeeIndexedDBService);

  transferCredits(fromUserId: number, toUserId: number, amount: number) {
    this.db.transaction('users', DBMode.ReadWrite, (store) => {
      // Deduct from sender
      const getFromRequest = store.get(fromUserId);
      getFromRequest.onsuccess = () => {
        const fromUser = getFromRequest.result;
        fromUser.credits -= amount;
        store.put(fromUser);
      };

      // Add to receiver
      const getToRequest = store.get(toUserId);
      getToRequest.onsuccess = () => {
        const toUser = getToRequest.result;
        toUser.credits += amount;
        store.put(toUser);
      };
    }).subscribe({
      next: () => console.log('Transfer successful'),
      error: (err) => console.error('Transfer failed, rolled back:', err)
    });
  }
}
```

### Batch Operations

Perform multiple operations in a single transaction:

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-batch',
  template: `<div>Batch operations</div>`,
})
export class BatchComponent {
  private db = inject(CatbeeIndexedDBService);

  syncChanges() {
    // Perform multiple operations atomically
    this.db.batch('users', [
      { type: 'add', value: { name: 'New User', email: 'new@example.com', role: 'user' } },
      { type: 'update', value: { id: 1, name: 'Updated', email: 'updated@example.com', role: 'admin' } },
      { type: 'delete', key: 5 }
    ]).subscribe(() => {
      console.log('Batch completed successfully');
    });
  }
}
```

### Event Monitoring

Subscribe to database changes in real-time:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-monitor',
  template: `
    <div>
      <h3>Recent Database Events</h3>
      <ul>
        <li *ngFor="let event of events">
          {{ event.type }} in {{ event.storeName }}
        </li>
      </ul>
      <p>Database State: {{ dbState }}</p>
    </div>
  `,
})
export class MonitorComponent implements OnInit {
  private db = inject(CatbeeIndexedDBService);
  events: any[] = [];
  dbState = 'unknown';

  ngOnInit() {
    // Monitor all database events
    this.db.events.subscribe(event => {
      console.log('DB Event:', event);
      this.events.unshift(event);
      if (this.events.length > 10) {
        this.events.pop(); // Keep last 10 events
      }
    });

    // Monitor connection state
    this.db.dbState.subscribe(state => {
      console.log('DB State:', state);
      this.dbState = state;
    });
  }
}
```

### Data Export/Import

Backup and restore data:

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-backup',
  template: `
    <button (click)="exportData()">Export Data</button>
    <button (click)="importData()">Import Data</button>
  `,
})
export class BackupComponent {
  private db = inject(CatbeeIndexedDBService);

  exportData() {
    this.db.export<User>('users').subscribe(data => {
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users-backup.json';
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  importData() {
    // Example: import from file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const data = JSON.parse(event.target.result);
        this.db.import('users', data).subscribe(() => {
          console.log('Data imported successfully');
        });
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }
}
```

### Caching Layer

Improve performance with built-in caching:

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';

@Component({
  selector: 'app-cached',
  template: `<div>Cached data</div>`,
})
export class CachedComponent {
  private db = inject(CatbeeIndexedDBService);

  loadUserWithCache(userId: number) {
    // This will use cache if available (default 5min expiry)
    this.db.cached(
      'users',
      `user-${userId}`,
      () => this.db.getByID<User>('users', userId)
    ).subscribe(user => {
      console.log('User (possibly from cache):', user);
    });
  }

  refreshData() {
    // Invalidate cache to force fresh fetch
    this.db.invalidateCache('users');
    
    // Or invalidate all cache
    this.db.invalidateCache();
  }
}
```


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
      mode: DBMode.ReadOnly
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
        mode: DBMode.ReadOnly
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
import { forkJoin, switchMap, Observable } from 'rxjs';

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
import { forkJoin, Observable } from 'rxjs';

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

## 📖 Documentation

💡 Full documentation available at [https://catbee.in](https://catbee.in/docs/@ng-catbee/indexed-db/intro/)

- [Introduction](https://catbee.in/docs/@ng-catbee/indexed-db/intro/)
- [Installation and Configuration](https://catbee.in/docs/@ng-catbee/indexed-db/installation/)
- [Usage](https://catbee.in/docs/@ng-catbee/indexed-db/usage/)
- [API Reference](https://catbee.in/docs/@ng-catbee/indexed-db/api-reference/)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.in/license/) file for the full text)

## 🔗 Links

- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Using IndexedDB (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Angular Documentation](https://angular.io/)
- [RxJS Documentation](https://rxjs.dev/)
- [Catbee Technologies](https://github.com/catbee-technologies)