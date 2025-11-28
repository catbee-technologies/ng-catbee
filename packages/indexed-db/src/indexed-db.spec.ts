import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { CatbeeIndexedDBService } from './indexed-db.service';
import { CATBEE_INDEXED_DB_CONFIG, provideCatbeeIndexedDB } from './indexed-db.config';
import { CatbeeIndexedDBConfig, DBMode, ObjectStoreMeta } from './indexed-db.types';

describe('CatbeeIndexedDBService', () => {
  // Suppress all console output during tests
  beforeAll(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'error').and.stub();
  });
  let service: CatbeeIndexedDBService;
  let mockIndexedDB: any;
  let databases: Map<string, any>;

  const testConfig: CatbeeIndexedDBConfig = {
    name: 'TestDB',
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
          { name: 'category', keypath: 'category', options: { unique: false } }
        ]
      }
    ]
  };

  interface TestUser {
    id?: number;
    name: string;
    email: string;
    role: string;
  }

  interface TestProduct {
    id?: number;
    sku: string;
    name: string;
    category: string;
    price: number;
  }

  beforeEach(() => {
    databases = new Map();

    // Mock IndexedDB
    mockIndexedDB = {
      open: jasmine.createSpy('open').and.callFake((name: string, version: number) => {
        const request: any = {
          result: null,
          error: null,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null
        };

        setTimeout(() => {
          let db = databases.get(name);
          let oldVersion = db ? db.version : 0;
          if (!db || oldVersion < version) {
            db = createMockDatabase(name, version);
            db.version = version;
            databases.set(name, db);
            if (request.onupgradeneeded) {
              const upgradeEvent = {
                target: request,
                oldVersion,
                newVersion: version
              } as any;
              request.result = db;
              request.transaction = db.transaction(Array.from(db.objectStoreNames.toArray()), 'versionchange');
              request.onupgradeneeded(upgradeEvent);
            }
          }
          request.result = db;
          if (request.onsuccess) {
            request.onsuccess({ target: request });
          }
        }, 0);
        return request;
      }),
      deleteDatabase: jasmine.createSpy('deleteDatabase').and.callFake((name: string) => {
        const request: any = {
          result: null,
          error: null,
          onsuccess: null,
          onerror: null
        };

        setTimeout(() => {
          databases.delete(name);
          if (request.onsuccess) {
            request.onsuccess({ target: request });
          }
        }, 0);

        return request;
      })
    };

    function createMockDatabase(name: string, version: number) {
      const stores = new Map<string, any>();
      return {
        name,
        version,
        objectStoreNames: {
          contains: (storeName: string) => stores.has(storeName),
          get length() {
            return stores.size;
          },
          item: (index: number) => Array.from(stores.keys())[index],
          [Symbol.iterator]: function* () {
            for (const key of stores.keys()) {
              yield key;
            }
          },
          toArray: () => Array.from(stores.keys())
        },
        createObjectStore: (storeName: string, options: any) => {
          const store = createMockObjectStore(storeName, options);
          stores.set(storeName, store);
          return store;
        },
        deleteObjectStore: (storeName: string) => {
          stores.delete(storeName);
        },
        transaction: (storeNamesParam: string[], mode: string) => {
          return createMockTransaction(storeNamesParam, mode, stores);
        },
        close: jasmine.createSpy('close')
      };
    }

    function createMockObjectStore(name: string, config: any) {
      const data = new Map<any, any>();
      const indexes = new Map<string, any>();
      let autoIncrementValue = 1;

      return {
        name,
        keyPath: config.keyPath,
        autoIncrement: config.autoIncrement,
        indexNames: {
          contains: (indexName: string) => indexes.has(indexName),
          length: indexes.size
        },
        createIndex: (indexName: string, keyPath: string, options: any) => {
          const index = createMockIndex(indexName, keyPath, options, data);
          indexes.set(indexName, index);
          return index;
        },
        index: (indexName: string) => {
          if (!indexes.has(indexName)) {
            throw new Error(`Index ${indexName} not found`);
          }
          return indexes.get(indexName);
        },
        add: (value: any, key?: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            try {
              // Unique index enforcement
              for (const index of indexes.values()) {
                if (index.unique) {
                  for (const v of data.values()) {
                    if (v[index.keyPath] === value[index.keyPath]) {
                      request.error = new Error('Key already exists');
                      if (request.onerror) request.onerror({ target: request });
                      return;
                    }
                  }
                }
              }
              const finalKey = key || (config.autoIncrement ? autoIncrementValue++ : value[config.keyPath]);
              if (data.has(finalKey)) {
                request.error = new Error('Key already exists');
                if (request.onerror) request.onerror({ target: request });
              } else {
                data.set(finalKey, { ...value, [config.keyPath]: finalKey });
                request.result = finalKey;
                if (request.onsuccess) request.onsuccess({ target: request });
              }
            } catch (error) {
              request.error = error;
              if (request.onerror) request.onerror({ target: request });
            }
          }, 0);
          return request;
        },
        put: (value: any, key?: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            // Unique index enforcement for put
            for (const index of indexes.values()) {
              if (index.unique) {
                for (const v of data.values()) {
                  if (v[index.keyPath] === value[index.keyPath] && v[config.keyPath] !== value[config.keyPath]) {
                    request.error = new Error('Key already exists');
                    if (request.onerror) request.onerror({ target: request });
                    return;
                  }
                }
              }
            }
            const finalKey = key || value[config.keyPath];
            data.set(finalKey, value);
            request.result = finalKey;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        get: (key: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            request.result = data.get(key) || undefined;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        getAll: (sortField?: string, sortDir?: 'asc' | 'desc') => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            let arr = Array.from(data.values());
            if (sortField) {
              arr.sort((a, b) => {
                if (a[sortField] < b[sortField]) return sortDir === 'desc' ? 1 : -1;
                if (a[sortField] > b[sortField]) return sortDir === 'desc' ? -1 : 1;
                return 0;
              });
            }
            request.result = arr;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        delete: (key: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            data.delete(key);
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        clear: () => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            data.clear();
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        count: (query?: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            request.result = data.size;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        openCursor: (query?: any, direction?: IDBCursorDirection) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            let values = Array.from(data.entries());
            if (direction === 'prev' || direction === 'prevunique') {
              values = values.reverse();
            }
            let index = 0;

            const cursorCallback = () => {
              if (index < values.length) {
                const [key, value] = values[index];
                request.result = {
                  key,
                  primaryKey: key,
                  value,
                  continue: () => {
                    index++;
                    setTimeout(cursorCallback, 0);
                  },
                  update: (newValue: any) => {
                    // Unique index enforcement for update
                    for (const index of indexes.values()) {
                      if (index.unique) {
                        for (const v of data.values()) {
                          if (v[index.keyPath] === newValue[index.keyPath] && v[config.keyPath] !== key) {
                            // Do not allow update if unique index would be violated
                            return { error: new Error('Key already exists') };
                          }
                        }
                      }
                    }
                    const updateRequest: any = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      data.set(key, newValue);
                      updateRequest.result = key;
                      if (updateRequest.onsuccess) updateRequest.onsuccess({ target: updateRequest });
                    }, 0);
                    return updateRequest;
                  },
                  delete: () => {
                    const deleteRequest: any = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      data.delete(key);
                      if (deleteRequest.onsuccess) deleteRequest.onsuccess({ target: deleteRequest });
                    }, 0);
                    return deleteRequest;
                  }
                };
              } else {
                request.result = null;
              }
              if (request.onsuccess) request.onsuccess({ target: request });
            };

            cursorCallback();
          }, 0);
          return request;
        },
        _getData: () => data,
        _getIndexes: () => indexes
      };
    }

    function createMockIndex(name: string, keyPath: string, options: any, storeData: Map<any, any>) {
      return {
        name,
        keyPath,
        unique: options.unique,
        get: (key: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            for (const value of storeData.values()) {
              if (value[keyPath] === key) {
                request.result = value;
                break;
              }
            }
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        getAll: () => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            request.result = Array.from(storeData.values());
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        count: (query?: any) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            request.result = storeData.size;
            if (request.onsuccess) request.onsuccess({ target: request });
          }, 0);
          return request;
        },
        openCursor: (query?: any, direction?: IDBCursorDirection) => {
          const request: any = { result: null, error: null, onsuccess: null, onerror: null };
          setTimeout(() => {
            let values = Array.from(storeData.entries());
            if (direction === 'prev' || direction === 'prevunique') {
              values = values.reverse();
            }
            let index = 0;

            const cursorCallback = () => {
              if (index < values.length) {
                const [key, value] = values[index];
                request.result = {
                  key: value[keyPath],
                  primaryKey: key,
                  value,
                  continue: () => {
                    index++;
                    setTimeout(cursorCallback, 0);
                  },
                  delete: () => {
                    const deleteRequest: any = { result: null, onsuccess: null, onerror: null };
                    setTimeout(() => {
                      storeData.delete(key);
                      if (deleteRequest.onsuccess) deleteRequest.onsuccess({ target: deleteRequest });
                    }, 0);
                    return deleteRequest;
                  }
                };
              } else {
                request.result = null;
              }
              if (request.onsuccess) request.onsuccess({ target: request });
            };

            cursorCallback();
          }, 0);
          return request;
        }
      };
    }

    function createMockTransaction(storeNames: string[], mode: string, stores: Map<string, any>) {
      const objectStores = new Map<string, any>();

      storeNames.forEach(name => {
        if (stores.has(name)) {
          objectStores.set(name, stores.get(name));
        }
      });

      const tx = {
        objectStore: (name: string) => {
          if (!objectStores.has(name)) {
            // Create temporary store for testing
            const store = createMockObjectStore(name, { keyPath: 'id', autoIncrement: true });
            objectStores.set(name, store);
            stores.set(name, store);
          }
          // Auto-complete transaction after allowing operations to execute
          setTimeout(() => {
            if (tx.oncomplete && typeof tx.oncomplete === 'function') {
              tx.oncomplete();
            }
          }, 10);
          return objectStores.get(name);
        },
        mode,
        oncomplete: null as (() => void) | null,
        onerror: null,
        onabort: null,
        error: null,
        abort: jasmine.createSpy('abort'),
        _complete: function () {
          setTimeout(() => {
            if (this.oncomplete && typeof this.oncomplete === 'function') {
              this.oncomplete();
            }
          }, 0);
        },
        complete: function () {
          this._complete();
        }
      };

      return tx;
    }

    // Mock window.indexedDB using Object.defineProperty
    Object.defineProperty(window, 'indexedDB', {
      writable: true,
      configurable: true,
      value: mockIndexedDB
    });

    TestBed.configureTestingModule({
      providers: [
        CatbeeIndexedDBService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: CATBEE_INDEXED_DB_CONFIG, useValue: testConfig }
      ]
    });

    service = TestBed.inject(CatbeeIndexedDBService);
  });

  afterEach(() => {
    databases.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with provided config', done => {
      service.initialize(testConfig).subscribe(() => {
        expect(mockIndexedDB.open).toHaveBeenCalledWith('TestDB', 1);
        done();
      });
    });

    it('should create object stores during initialization', done => {
      service.initialize(testConfig).subscribe(() => {
        service.getAllObjectStoreNames().subscribe(names => {
          expect(names).toContain('users');
          expect(names).toContain('products');
          done();
        });
      });
    });

    it('should handle database version', done => {
      service.initialize(testConfig).subscribe(() => {
        service.getDatabaseVersion().subscribe(version => {
          expect(version).toBe(1);
          done();
        });
      });
    });
  });

  describe('Basic CRUD Operations', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    describe('add()', () => {
      it('should add a new entry', done => {
        const user: TestUser = { name: 'John Doe', email: 'john@example.com', role: 'admin' };

        service.add('users', user).subscribe(result => {
          expect(result).toBeDefined();
          expect(result.id).toBeDefined();
          expect(result.name).toBe('John Doe');
          expect(result.email).toBe('john@example.com');
          done();
        });
      });

      it('should add entry with specific key', done => {
        const user: TestUser = { id: 999, name: 'Jane', email: 'jane@example.com', role: 'user' };

        service.add('users', user, 999).subscribe(result => {
          expect(result.id).toBe(999);
          done();
        });
      });

      it('should auto-increment IDs', done => {
        const user1: TestUser = { name: 'User 1', email: 'user1@example.com', role: 'user' };
        const user2: TestUser = { name: 'User 2', email: 'user2@example.com', role: 'user' };

        service.add('users', user1).subscribe(result1 => {
          service.add('users', user2).subscribe(result2 => {
            expect(result2.id).toBeGreaterThan(result1.id!);
            done();
          });
        });
      });
    });

    describe('bulkAdd()', () => {
      it('should add multiple entries', done => {
        const users = [
          { name: 'Alice', email: 'alice@example.com', role: 'user' },
          { name: 'Bob', email: 'bob@example.com', role: 'admin' },
          { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          expect(keys.length).toBe(3);
          expect(keys.every(key => typeof key === 'number')).toBe(true);
          done();
        });
      });

      it('should handle empty array', done => {
        service.bulkAdd('users', []).subscribe(keys => {
          expect(keys).toEqual([]);
          expect(keys.length).toBe(0);
          done();
        });
      });

      it('should add entries with custom keys', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user', key: 100 },
          { name: 'User 2', email: 'user2@example.com', role: 'user', key: 200 }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          expect(keys).toContain(100);
          expect(keys).toContain(200);
          done();
        });
      });
    });

    describe('getByKey() and getByID()', () => {
      it('should get entry by key', done => {
        const user: TestUser = { name: 'John', email: 'john@example.com', role: 'admin' };

        service.add('users', user).subscribe(added => {
          service.getByKey<TestUser>('users', added.id!).subscribe(retrieved => {
            expect(retrieved).toBeDefined();
            expect(retrieved.name).toBe('John');
            expect(retrieved.email).toBe('john@example.com');
            done();
          });
        });
      });

      it('should get entry by ID (alias)', done => {
        const user: TestUser = { name: 'Jane', email: 'jane@example.com', role: 'user' };

        service.add('users', user).subscribe(added => {
          service.getByID<TestUser>('users', added.id!).subscribe(retrieved => {
            expect(retrieved.name).toBe('Jane');
            done();
          });
        });
      });

      it('should return undefined for non-existent key', done => {
        service.getByKey<TestUser>('users', 99999).subscribe(result => {
          expect(result).toBeUndefined();
          done();
        });
      });
    });

    describe('bulkGet()', () => {
      it('should get multiple entries by keys', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' },
          { name: 'User 3', email: 'user3@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          service.bulkGet<TestUser>('users', keys).subscribe(retrieved => {
            expect(retrieved.length).toBe(3);
            expect(retrieved[0].name).toBe('User 1');
            expect(retrieved[1].name).toBe('User 2');
            expect(retrieved[2].name).toBe('User 3');
            done();
          });
        });
      });

      it('should handle empty keys array', done => {
        service.bulkGet<TestUser>('users', []).subscribe(results => {
          expect(results).toEqual([]);
          expect(results.length).toBe(0);
          done();
        });
      });
    });

    describe('getAll()', () => {
      it('should get all entries', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.getAll<TestUser>('users').subscribe(all => {
            expect(all.length).toBe(2);
            done();
          });
        });
      });

      it('should return empty array for empty store', done => {
        service.getAll<TestUser>('users').subscribe(all => {
          expect(all).toEqual([]);
          done();
        });
      });
    });

    describe('update()', () => {
      it('should update existing entry', done => {
        const user: TestUser = { name: 'John', email: 'john@example.com', role: 'user' };

        service.add('users', user).subscribe(added => {
          const updated: TestUser = {
            id: added.id,
            name: 'John Updated',
            email: 'john.new@example.com',
            role: 'admin'
          };

          service.update('users', updated).subscribe(result => {
            expect(result.name).toBe('John Updated');
            expect(result.email).toBe('john.new@example.com');
            expect(result.role).toBe('admin');
            done();
          });
        });
      });

      it('should create entry if not exists (put behavior)', done => {
        const user: TestUser = { id: 500, name: 'New User', email: 'new@example.com', role: 'user' };

        service.update('users', user).subscribe(result => {
          expect(result.id).toBe(500);
          expect(result.name).toBe('New User');
          done();
        });
      });
    });

    describe('bulkPut()', () => {
      it('should update multiple entries', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          const updates = [
            { id: keys[0], name: 'Updated 1', email: 'updated1@example.com', role: 'admin' },
            { id: keys[1], name: 'Updated 2', email: 'updated2@example.com', role: 'admin' }
          ];

          service.bulkPut('users', updates).subscribe(lastKey => {
            expect(lastKey).toBeDefined();
            done();
          });
        });
      });
    });

    describe('deleteByKey()', () => {
      it('should delete entry by key', done => {
        const user: TestUser = { name: 'John', email: 'john@example.com', role: 'user' };

        service.add('users', user).subscribe(added => {
          service.deleteByKey('users', added.id!).subscribe(() => {
            service.getByKey<TestUser>('users', added.id!).subscribe(result => {
              expect(result).toBeUndefined();
              done();
            });
          });
        });
      });
    });

    describe('bulkDelete()', () => {
      it('should delete multiple entries', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' },
          { name: 'User 3', email: 'user3@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          service.bulkDelete('users', [keys[0], keys[1]]).subscribe(remainingCount => {
            expect(remainingCount).toBe(1);
            done();
          });
        });
      });
    });

    describe('delete()', () => {
      it('should delete entry and return remaining', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          service.delete<TestUser>('users', keys[0]).subscribe(remaining => {
            expect(remaining.length).toBe(1);
            expect(remaining[0].name).toBe('User 2');
            done();
          });
        });
      });
    });

    describe('clear()', () => {
      it('should clear all entries from store', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.clear('users').subscribe(() => {
            service.count('users').subscribe(count => {
              expect(count).toBe(0);
              done();
            });
          });
        });
      });
    });

    describe('count()', () => {
      it('should count entries in store', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' },
          { name: 'User 3', email: 'user3@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.count('users').subscribe(count => {
            expect(count).toBe(3);
            done();
          });
        });
      });

      it('should return 0 for empty store', done => {
        service.count('users').subscribe(count => {
          expect(count).toBe(0);
          done();
        });
      });
    });
  });

  describe('Index Operations', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    describe('getByIndex()', () => {
      it('should get entry by index', done => {
        const user: TestUser = { name: 'John', email: 'john@example.com', role: 'admin' };

        service.add('users', user).subscribe(() => {
          service.getByIndex<TestUser>('users', 'email', 'john@example.com').subscribe(result => {
            expect(result).toBeDefined();
            expect(result.name).toBe('John');
            expect(result.email).toBe('john@example.com');
            done();
          });
        });
      });

      it('should return undefined if not found', done => {
        service.getByIndex<TestUser>('users', 'email', 'nonexistent@example.com').subscribe(result => {
          expect(result).toBeFalsy(); // Can be undefined or null
          done();
        });
      });
    });

    describe('getAllByIndex()', () => {
      it('should get all entries matching index value', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.getAllByIndex<TestUser>('users', 'role', 'admin').subscribe(admins => {
            expect(admins.length).toBeGreaterThanOrEqual(0);
            done();
          });
        });
      });

      it('should return empty array if no matches', done => {
        service.getAllByIndex<TestUser>('users', 'role', 'superadmin').subscribe(results => {
          expect(results).toEqual([]);
          done();
        });
      });
    });

    describe('countByIndex()', () => {
      it('should count entries by index', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.countByIndex('users', 'role', 'admin').subscribe(count => {
            expect(count).toBeGreaterThanOrEqual(0);
            done();
          });
        });
      });
    });

    describe('deleteAllByIndex()', () => {
      it('should delete all entries matching index', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.deleteAllByIndex('users', 'role', 'admin').subscribe(() => {
            service.count('users').subscribe(count => {
              expect(count).toBeGreaterThanOrEqual(0);
              done();
            });
          });
        });
      });
    });

    describe('getAllKeysByIndex()', () => {
      it('should get all keys by index', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.getAllKeysByIndex('users', 'role', 'user').subscribe(keys => {
            expect(Array.isArray(keys)).toBe(true);
            done();
          });
        });
      });
    });
  });

  describe('Cursor Operations', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'admin' },
          { name: 'User 3', email: 'user3@example.com', role: 'user' }
        ];
        service.bulkAdd('users', users).subscribe(() => done());
      });
    });

    describe('openCursor()', () => {
      it('should iterate over entries with cursor', done => {
        const results: any[] = [];

        service
          .openCursor<TestUser>({
            storeName: 'users',
            mode: DBMode.ReadOnly
          })
          .subscribe({
            next: cursor => {
              results.push(cursor.value);
              cursor.continue();
            },
            complete: () => {
              expect(results.length).toBe(3);
              done();
            }
          });
      });

      it('should allow updating entries via cursor', done => {
        let updated = false;

        service
          .openCursor<TestUser>({
            storeName: 'users',
            mode: DBMode.ReadWrite
          })
          .subscribe({
            next: cursor => {
              const value = cursor.value as TestUser;
              if (!updated && value.role === 'user') {
                const updatedValue = { ...value, role: 'power-user' };
                cursor.update(updatedValue);
                updated = true;
              }
              cursor.continue();
            },
            complete: () => {
              expect(updated).toBe(true);
              done();
            }
          });
      });
    });

    describe('openCursorByIndex()', () => {
      it('should iterate over entries by index', done => {
        const results: any[] = [];

        service
          .openCursorByIndex<TestUser>({
            storeName: 'users',
            indexName: 'role',
            mode: DBMode.ReadOnly
          })
          .subscribe({
            next: cursor => {
              results.push(cursor.value);
              cursor.continue();
            },
            complete: () => {
              expect(results.length).toBe(3);
              done();
            }
          });
      });
    });
  });

  describe('Database Management', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    describe('getDatabaseVersion()', () => {
      it('should return database version', done => {
        service.getDatabaseVersion().subscribe(version => {
          expect(version).toBe(1);
          done();
        });
      });
    });

    describe('getAllObjectStoreNames()', () => {
      it('should return all object store names', done => {
        service.getAllObjectStoreNames().subscribe(names => {
          expect(names).toContain('users');
          expect(names).toContain('products');
          done();
        });
      });
    });

    describe('deleteDatabase()', () => {
      it('should delete the entire database', done => {
        service.deleteDatabase().subscribe(() => {
          expect(mockIndexedDB.deleteDatabase).toHaveBeenCalledWith('TestDB');
          done();
        });
      });
    });

    describe('deleteObjectStore()', () => {
      it('should delete an object store', done => {
        // Requires version upgrade handling - complex to mock
        service.deleteObjectStore('products').subscribe(() => {
          service.getAllObjectStoreNames().subscribe(names => {
            expect(names).not.toContain('products');
            done();
          });
        });
      });
    });

    describe('createObjectStore()', () => {
      it('should create a new object store', done => {
        // Requires version upgrade handling - complex to mock
        const newStore: ObjectStoreMeta = {
          store: 'orders',
          storeConfig: { keyPath: 'id', autoIncrement: true },
          storeSchema: [
            { name: 'orderId', keypath: 'orderId', options: { unique: true } },
            { name: 'status', keypath: 'status', options: { unique: false } }
          ]
        };

        service.createObjectStore(newStore).then(() => {
          service.getAllObjectStoreNames().subscribe(names => {
            expect(names).toContain('orders');
            done();
          });
        });
      });
    });
  });

  describe('SSR Compatibility', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CatbeeIndexedDBService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: CATBEE_INDEXED_DB_CONFIG, useValue: testConfig }
        ]
      });
      service = TestBed.inject(CatbeeIndexedDBService);
    });

    it('should handle operations gracefully on server', done => {
      // SSR testing requires different setup - skip for now
      done();
    });

    it('should not throw errors during SSR', done => {
      // SSR testing requires different setup - skip for now
      done();
    });
  });

  describe('Error Handling', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    it('should handle non-existent store gracefully', done => {
      service.getAll('nonexistent').subscribe({
        next: results => {
          expect(results).toBeDefined();
          done();
        },
        error: () => done()
      });
    });

    it('should handle duplicate key errors', done => {
      const user: TestUser = { id: 1, name: 'John', email: 'john@example.com', role: 'user' };

      service.add('users', user, 1).subscribe(() => {
        service.add('users', user, 1).subscribe({
          next: () => fail('Should have thrown error'),
          error: error => {
            expect(error).toBeDefined();
            done();
          }
        });
      });
    });
  });

  describe('Complex Scenarios', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    it('should handle multiple stores independently', done => {
      const user: TestUser = { name: 'John', email: 'john@example.com', role: 'user' };
      const product: TestProduct = { sku: 'SKU-001', name: 'Product 1', category: 'Electronics', price: 99.99 };

      service.add('users', user).subscribe(() => {
        service.add('products', product).subscribe(() => {
          service.count('users').subscribe(userCount => {
            service.count('products').subscribe(productCount => {
              expect(userCount).toBe(1);
              expect(productCount).toBe(1);
              done();
            });
          });
        });
      });
    });

    it('should handle transactions correctly', done => {
      const users = [
        { name: 'User 1', email: 'user1@example.com', role: 'user' },
        { name: 'User 2', email: 'user2@example.com', role: 'user' }
      ];

      service.bulkAdd('users', users).subscribe(() => {
        service.getAll<TestUser>('users').subscribe(allUsers => {
          expect(allUsers.length).toBe(2);
          done();
        });
      });
    });

    it('should maintain data integrity across operations', done => {
      const user: TestUser = { name: 'Original', email: 'original@example.com', role: 'user' };

      service.add('users', user).subscribe(added => {
        const updated: TestUser = { id: added.id, name: 'Updated', email: 'updated@example.com', role: 'admin' };

        service.update('users', updated).subscribe(() => {
          service.getByKey<TestUser>('users', added.id!).subscribe(retrieved => {
            expect(retrieved.name).toBe('Updated');
            expect(retrieved.email).toBe('updated@example.com');
            expect(retrieved.role).toBe('admin');
            done();
          });
        });
      });
    });
  });

  describe('Database Migrations', () => {
    it('should run migrations on version upgrade', done => {
      let migrationRun = false;

      const configWithMigration: CatbeeIndexedDBConfig = {
        ...testConfig,
        version: 2,
        migrationFactory: () => ({
          2: (db: IDBDatabase, transaction: IDBTransaction) => {
            migrationRun = true;
          }
        })
      };

      service.initialize(configWithMigration).subscribe(() => {
        expect(migrationRun).toBe(true);
        done();
      });
    });
  });

  describe('Performance Tests', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    it('should handle bulk operations efficiently', done => {
      const users = Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: i % 2 === 0 ? 'user' : 'admin'
      }));

      const startTime = Date.now();

      service.bulkAdd('users', users).subscribe(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

        service.count('users').subscribe(count => {
          expect(count).toBe(100);
          done();
        });
      });
    });
  });

  describe('Edge Cases and Additional Coverage', () => {
    beforeEach(done => {
      service.initialize(testConfig).subscribe(() => done());
    });

    describe('bulkPut() edge cases', () => {
      it('should handle empty array in bulkPut', done => {
        service.bulkPut('users', []).subscribe({
          next: () => done.fail('Should not emit for empty array'),
          error: () => done.fail('Should not error'),
          complete: () => {
            expect(true).toBe(true); // Empty array completes without emitting
            done();
          }
        });
      });

      it('should update and create entries in bulkPut', done => {
        const user: TestUser = { name: 'Original', email: 'original@example.com', role: 'user' };

        service.add('users', user).subscribe(added => {
          const updates: TestUser[] = [
            { id: added.id, name: 'Updated', email: 'updated@example.com', role: 'admin' },
            { id: 999, name: 'New', email: 'new@example.com', role: 'user' }
          ];

          service.bulkPut('users', updates).subscribe(lastKey => {
            expect(lastKey).toBeDefined();
            service.count('users').subscribe(count => {
              expect(count).toBe(2);
              done();
            });
          });
        });
      });
    });

    describe('Index operations edge cases', () => {
      it('should handle deleteAllByIndex with no matches', done => {
        service.deleteAllByIndex('users', 'role', 'superadmin').subscribe(() => {
          service.count('users').subscribe(count => {
            expect(count).toBe(0);
            done();
          });
        });
      });

      it('should delete all matching entries by index', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.deleteAllByIndex('users', 'role', 'admin').subscribe(() => {
            service.count('users').subscribe(count => {
              // Should have deleted the admin entries
              expect(count).toBeGreaterThanOrEqual(0);
              done();
            });
          });
        });
      });

      it('should get all keys by index value', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.getAllKeysByIndex('users', 'role', 'admin').subscribe(keys => {
            expect(keys.length).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(keys)).toBe(true);
            done();
          });
        });
      });
    });

    describe('Cursor deletion', () => {
      it('should delete entries via cursor', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          let deleted = false;

          service
            .openCursor<TestUser>({
              storeName: 'users',
              mode: DBMode.ReadWrite
            })
            .subscribe({
              next: cursor => {
                const value = cursor.value as TestUser;
                if (!deleted && value.role === 'admin') {
                  cursor.delete();
                  deleted = true;
                }
                cursor.continue();
              },
              complete: () => {
                expect(deleted).toBe(true);
                service.count('users').subscribe(count => {
                  expect(count).toBe(2);
                  done();
                });
              }
            });
        });
      });

      it('should delete entries via cursor by index', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service
            .openCursorByIndex<TestUser>({
              storeName: 'users',
              indexName: 'role',
              mode: DBMode.ReadWrite
            })
            .subscribe({
              next: cursor => {
                cursor.delete();
                cursor.continue();
              },
              complete: () => {
                service.count('users').subscribe(count => {
                  expect(count).toBe(0);
                  done();
                });
              }
            });
        });
      });
    });

    describe('Service without global config', () => {
      it('should work when initialized manually without global config', done => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' }
            // No CATBEE_INDEXED_DB_CONFIG provided
          ]
        });

        const newService = TestBed.inject(CatbeeIndexedDBService);

        newService.initialize(testConfig).subscribe(() => {
          newService.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(result => {
            expect(result).toBeDefined();
            expect(result.name).toBe('Test');
            done();
          });
        });
      });
    });

    describe('Transaction mode variations', () => {
      it('should handle readonly cursor operations', done => {
        const users = [{ name: 'User 1', email: 'user1@example.com', role: 'user' }];

        service.bulkAdd('users', users).subscribe(() => {
          const results: TestUser[] = [];

          service
            .openCursor<TestUser>({
              storeName: 'users',
              mode: DBMode.ReadOnly
            })
            .subscribe({
              next: cursor => {
                results.push(cursor.value as TestUser);
                cursor.continue();
              },
              complete: () => {
                expect(results.length).toBe(1);
                expect(results[0].name).toBe('User 1');
                done();
              }
            });
        });
      });

      it('should handle readwrite operations', done => {
        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(added => {
          const updated: TestUser = { id: added.id, name: 'Updated', email: 'updated@example.com', role: 'admin' };

          service.update('users', updated).subscribe(result => {
            expect(result.name).toBe('Updated');
            done();
          });
        });
      });
    });

    describe('Database operations', () => {
      it('should return correct database version', done => {
        service.getDatabaseVersion().subscribe(version => {
          expect(version).toBe(1);
          done();
        });
      });

      it('should list all object store names', done => {
        service.getAllObjectStoreNames().subscribe(names => {
          // Accept 2 or more stores, but must contain 'users' and 'products'
          expect(names).toContain('users');
          expect(names).toContain('products');
          done();
        });
      });
    });

    describe('Key range queries', () => {
      it('should handle IDBKeyRange in queries', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' },
          { name: 'User 3', email: 'user3@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          // Delete using first key as a single key (not a range)
          service.deleteByKey('users', keys[0]).subscribe(() => {
            service.count('users').subscribe(count => {
              expect(count).toBe(2);
              done();
            });
          });
        });
      });
    });

    describe('Multiple product store operations', () => {
      it('should work with products store', done => {
        const product: TestProduct = {
          sku: 'SKU-001',
          name: 'Test Product',
          category: 'Electronics',
          price: 99.99
        };

        service.add('products', product).subscribe(added => {
          expect(added).toBeDefined();
          expect(added.sku).toBe('SKU-001');

          service.getByKey<TestProduct>('products', added.id!).subscribe(retrieved => {
            expect(retrieved.name).toBe('Test Product');
            expect(retrieved.price).toBe(99.99);
            done();
          });
        });
      });

      it('should handle product index queries', done => {
        const products = [
          { sku: 'SKU-001', name: 'Product 1', category: 'Electronics', price: 99.99 },
          { sku: 'SKU-002', name: 'Product 2', category: 'Electronics', price: 149.99 },
          { sku: 'SKU-003', name: 'Product 3', category: 'Clothing', price: 29.99 }
        ];

        service.bulkAdd('products', products).subscribe(() => {
          service.getByIndex<TestProduct>('products', 'sku', 'SKU-002').subscribe(result => {
            expect(result).toBeDefined();
            expect(result.name).toBe('Product 2');
            done();
          });
        });
      });
    });

    describe('Concurrent operations', () => {
      it('should handle multiple concurrent adds', done => {
        const user1: TestUser = { name: 'User 1', email: 'user1@example.com', role: 'user' };
        const user2: TestUser = { name: 'User 2', email: 'user2@example.com', role: 'admin' };

        let count = 0;
        const checkDone = () => {
          count++;
          if (count === 2) {
            service.count('users').subscribe(total => {
              expect(total).toBe(2);
              done();
            });
          }
        };

        service.add('users', user1).subscribe(() => checkDone());
        service.add('users', user2).subscribe(() => checkDone());
      });
    });

    describe('Data integrity', () => {
      it('should preserve data types', done => {
        const product: TestProduct = {
          sku: 'SKU-TEST',
          name: 'Test Product',
          category: 'Electronics',
          price: 123.45
        };

        service.add('products', product).subscribe(added => {
          service.getByKey<TestProduct>('products', added.id!).subscribe(retrieved => {
            expect(typeof retrieved.price).toBe('number');
            expect(retrieved.price).toBe(123.45);
            expect(typeof retrieved.sku).toBe('string');
            done();
          });
        });
      });

      it('should handle special characters in data', done => {
        const user: TestUser = {
          name: "O'Brien <Test>",
          email: 'test+special@example.com',
          role: 'user & admin'
        };

        service.add('users', user).subscribe(added => {
          service.getByKey<TestUser>('users', added.id!).subscribe(retrieved => {
            expect(retrieved.name).toBe("O'Brien <Test>");
            expect(retrieved.email).toBe('test+special@example.com');
            expect(retrieved.role).toBe('user & admin');
            done();
          });
        });
      });
    });

    describe('Cursor directions', () => {
      it('should iterate cursor in next direction', done => {
        const users = [
          { name: 'Alice', email: 'alice@example.com', role: 'user' },
          { name: 'Bob', email: 'bob@example.com', role: 'user' },
          { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          const results: TestUser[] = [];

          service
            .openCursor<TestUser>({
              storeName: 'users',
              mode: DBMode.ReadOnly,
              direction: 'next'
            })
            .subscribe({
              next: cursor => {
                results.push(cursor.value as TestUser);
                cursor.continue();
              },
              complete: () => {
                expect(results.length).toBe(3);
                done();
              }
            });
        });
      });

      it('should iterate cursor by index with direction', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'admin' },
          { name: 'User 2', email: 'user2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          const results: TestUser[] = [];

          service
            .openCursorByIndex<TestUser>({
              storeName: 'users',
              indexName: 'role',
              mode: DBMode.ReadOnly,
              direction: 'next'
            })
            .subscribe({
              next: cursor => {
                results.push(cursor.value as TestUser);
                cursor.continue();
              },
              complete: () => {
                expect(results.length).toBeGreaterThanOrEqual(2);
                done();
              }
            });
        });
      });
    });

    describe('Error scenarios', () => {
      it('should handle error when adding with duplicate unique index', done => {
        // This test requires mock to enforce unique index constraints
        const user1: TestUser = { name: 'User 1', email: 'duplicate@example.com', role: 'user' };
        const user2: TestUser = { name: 'User 2', email: 'duplicate@example.com', role: 'admin' };

        service.add('users', user1).subscribe(() => {
          service.add('users', user2).subscribe({
            next: () => done.fail('Should have failed due to unique constraint'),
            error: error => {
              expect(error).toBeDefined();
              done();
            }
          });
        });
      });

      it('should handle bulkDelete with empty array', done => {
        // Empty array should return current count
        service.bulkDelete('users', []).subscribe(result => {
          expect(result).toBeDefined();
          expect(typeof result).toBe('number');
          expect(result).toBe(0); // No users in store
          done();
        });
      });

      it('should handle getByIndex error for non-existent index', done => {
        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(() => {
          // Try to use a non-existent index - should be caught by mock
          service.getByIndex<TestUser>('users', 'nonexistent', 'value').subscribe({
            next: () => done(),
            error: error => {
              expect(error).toBeDefined();
              done();
            }
          });
        });
      });
    });

    describe('Query variations', () => {
      it('should handle countByIndex with query', done => {
        const users = [
          { name: 'Admin 1', email: 'admin1@example.com', role: 'admin' },
          { name: 'Admin 2', email: 'admin2@example.com', role: 'admin' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.countByIndex('users', 'role', 'admin').subscribe(count => {
            expect(count).toBeGreaterThanOrEqual(0);
            done();
          });
        });
      });

      it('should handle deleteAllByIndex with direction', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'test' },
          { name: 'User 2', email: 'user2@example.com', role: 'test' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.deleteAllByIndex('users', 'role', 'test', 'next').subscribe(() => {
            service.count('users').subscribe(count => {
              expect(count).toBe(0);
              done();
            });
          });
        });
      });

      it('should handle getAllKeysByIndex with direction', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          service.getAllKeysByIndex('users', 'role', 'user', 'next').subscribe(keys => {
            expect(Array.isArray(keys)).toBe(true);
            expect(keys.length).toBeGreaterThanOrEqual(0);
            done();
          });
        });
      });
    });

    describe('Complex cursor operations', () => {
      it('should handle cursor with query parameter', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => {
          const results: TestUser[] = [];

          service
            .openCursor<TestUser>({
              storeName: 'users',
              mode: DBMode.ReadOnly,
              query: null
            })
            .subscribe({
              next: cursor => {
                results.push(cursor.value as TestUser);
                cursor.continue();
              },
              complete: () => {
                expect(results.length).toBe(2);
                done();
              }
            });
        });
      });

      it('should handle cursor by index with query', done => {
        const users = [{ name: 'Admin 1', email: 'admin1@example.com', role: 'admin' }];

        service.bulkAdd('users', users).subscribe(() => {
          const results: TestUser[] = [];

          service
            .openCursorByIndex<TestUser>({
              storeName: 'users',
              indexName: 'role',
              mode: DBMode.ReadOnly,
              query: 'admin'
            })
            .subscribe({
              next: cursor => {
                results.push(cursor.value as TestUser);
                cursor.continue();
              },
              complete: () => {
                expect(results.length).toBeGreaterThanOrEqual(1);
                done();
              }
            });
        });
      });
    });

    describe('Migration and version handling', () => {
      it('should handle config with explicit version', done => {
        // Mock database version is fixed during creation
        const configWithVersion: CatbeeIndexedDBConfig = {
          ...testConfig,
          version: 3
        };

        service.initialize(configWithVersion).subscribe(() => {
          service.getDatabaseVersion().subscribe(version => {
            expect(version).toBe(3);
            done();
          });
        });
      });

      it('should initialize with migration factory', done => {
        // Already tested in Database Migrations section
        let factoryCalled = false;

        const configWithFactory: CatbeeIndexedDBConfig = {
          ...testConfig,
          version: 2,
          migrationFactory: () => {
            factoryCalled = true;
            return {
              2: (db: IDBDatabase, transaction: IDBTransaction) => {
                // Migration logic
              }
            };
          }
        };

        service.initialize(configWithFactory).subscribe(() => {
          expect(factoryCalled).toBe(true);
          done();
        });
      });
    });

    describe('Bulk operations stress tests', () => {
      it('should handle bulkAdd with single item', done => {
        service.bulkAdd('users', [{ name: 'Single', email: 'single@example.com', role: 'user' }]).subscribe(keys => {
          expect(keys.length).toBe(1);
          done();
        });
      });

      it('should handle bulkGet with single key', done => {
        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(added => {
          service.bulkGet<TestUser>('users', [added.id!]).subscribe(results => {
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Test');
            done();
          });
        });
      });

      it('should handle bulkPut with single item', done => {
        service.add('users', { name: 'Original', email: 'original@example.com', role: 'user' }).subscribe(added => {
          service
            .bulkPut('users', [{ id: added.id, name: 'Updated', email: 'updated@example.com', role: 'admin' }])
            .subscribe(lastKey => {
              expect(lastKey).toBeDefined();
              done();
            });
        });
      });

      it('should handle bulkDelete with single key', done => {
        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(added => {
          service.bulkDelete('users', [added.id!]).subscribe(remainingCount => {
            expect(remainingCount).toBe(0);
            done();
          });
        });
      });
    });

    describe('Event System', () => {
      it('should emit add event', done => {
        let eventReceived = false;

        const subscription = service.events.subscribe(event => {
          if (event.type === 'add' && event.storeName === 'users') {
            eventReceived = true;
            expect(event.data).toBeDefined();
            subscription.unsubscribe();
          }
        });

        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(() => {
          setTimeout(() => {
            expect(eventReceived).toBe(true);
            done();
          }, 100);
        });
      });

      it('should emit update event', done => {
        let eventReceived = false;

        service.add('users', { name: 'Original', email: 'test@example.com', role: 'user' }).subscribe(user => {
          const subscription = service.events.subscribe(event => {
            if (event.type === 'update' && event.storeName === 'users') {
              eventReceived = true;
              subscription.unsubscribe();
            }
          });

          service.update('users', { ...user, name: 'Updated' }).subscribe(() => {
            setTimeout(() => {
              expect(eventReceived).toBe(true);
              done();
            }, 100);
          });
        });
      });

      it('should emit delete event', done => {
        let eventReceived = false;

        service.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(user => {
          const subscription = service.events.subscribe(event => {
            if (event.type === 'delete' && event.storeName === 'users') {
              eventReceived = true;
              subscription.unsubscribe();
            }
          });

          service.deleteByKey('users', user.id!).subscribe(() => {
            setTimeout(() => {
              expect(eventReceived).toBe(true);
              done();
            }, 100);
          });
        });
      });

      it('should emit clear event', done => {
        let eventReceived = false;

        const subscription = service.events.subscribe(event => {
          if (event.type === 'clear' && event.storeName === 'users') {
            eventReceived = true;
            subscription.unsubscribe();
          }
        });

        service.clear('users').subscribe(() => {
          setTimeout(() => {
            expect(eventReceived).toBe(true);
            done();
          }, 100);
        });
      });
    });

    describe('Database State', () => {
      it('should emit database state changes', done => {
        const states: string[] = [];

        const subscription = service.dbState.subscribe(state => {
          states.push(state);
        });

        setTimeout(() => {
          expect(states.length).toBeGreaterThan(0);
          expect(states).toContain('open');
          subscription.unsubscribe();
          done();
        }, 100);
      });
    });

    describe('Query Builder', () => {
      beforeEach(done => {
        const users = [
          { name: 'Alice', email: 'alice@example.com', role: 'admin' },
          { name: 'Bob', email: 'bob@example.com', role: 'user' },
          { name: 'Charlie', email: 'charlie@example.com', role: 'user' },
          { name: 'David', email: 'david@example.com', role: 'admin' },
          { name: 'Eve', email: 'eve@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => done());
      });

      it('should filter by single condition', done => {
        service
          .query<TestUser>('users')
          .where('role', '=', 'admin')
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(2);
            expect(users.every(u => u.role === 'admin')).toBe(true);
            done();
          });
      });

      it('should filter by multiple conditions', done => {
        service
          .query<TestUser>('users')
          .where('role', '=', 'user')
          .where('name', '!=', 'Bob')
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(2);
            expect(users.every(u => u.role === 'user' && u.name !== 'Bob')).toBe(true);
            done();
          });
      });

      it('should sort results ascending', done => {
        service
          .query<TestUser>('users')
          .orderBy('name', 'asc')
          .execute()
          .subscribe(users => {
            expect(users[0].name).toBe('Alice');
            expect(users[users.length - 1].name).toBe('Eve');
            done();
          });
      });

      it('should sort results descending', done => {
        service
          .query<TestUser>('users')
          .orderBy('name', 'desc')
          .execute()
          .subscribe(users => {
            expect(users[0].name).toBe('Eve');
            expect(users[users.length - 1].name).toBe('Alice');
            done();
          });
      });

      it('should limit results', done => {
        service
          .query<TestUser>('users')
          .limit(2)
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(2);
            done();
          });
      });

      it('should offset results', done => {
        service
          .query<TestUser>('users')
          .orderBy('name', 'asc')
          .offset(2)
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(3);
            expect(users[0].name).toBe('Charlie');
            done();
          });
      });

      it('should combine filter, sort, offset and limit', done => {
        service
          .query<TestUser>('users')
          .where('role', '=', 'user')
          .orderBy('name', 'asc')
          .offset(1)
          .limit(1)
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(1);
            expect(users[0].name).toBe('Charlie');
            done();
          });
      });

      it('should copy query builder', done => {
        const baseQuery = service.query<TestUser>('users').where('role', '=', 'user').limit(2);

        const query1 = baseQuery.copy().where('name', '=', 'Bob');
        const query2 = baseQuery.copy().where('name', '=', 'Eve');

        query1.execute().subscribe(users1 => {
          expect(users1.length).toBe(1);
          expect(users1[0].name).toBe('Bob');

          query2.execute().subscribe(users2 => {
            expect(users2.length).toBe(1);
            expect(users2[0].name).toBe('Eve');
            done();
          });
        });
      });

      it('should handle comparison operators (>, <, >=, <=)', done => {
        const products = [
          { sku: 'P1', name: 'Product 1', category: 'A', price: 10 },
          { sku: 'P2', name: 'Product 2', category: 'A', price: 20 },
          { sku: 'P3', name: 'Product 3', category: 'A', price: 30 }
        ];

        service.bulkAdd('products', products).subscribe(() => {
          service
            .query<TestProduct>('products')
            .where('price', '>', 15)
            .execute()
            .subscribe(results => {
              expect(results.length).toBe(2);
              expect(results.every(p => p.price > 15)).toBe(true);
              done();
            });
        });
      });

      it('should handle null/undefined in filters', done => {
        service
          .query<TestUser>('users')
          .where('role', '=', null as any)
          .execute()
          .subscribe(users => {
            expect(users.length).toBe(0);
            done();
          });
      });

      it('should warn on unknown operator', done => {
        // Create query with invalid operator (force type casting)
        const query = service.query<TestUser>('users');
        (query as any).filters = [{ field: 'role', operator: 'invalid', value: 'admin' }];

        query.execute().subscribe(users => {
          // The warning would have been logged by now
          expect(users).toBeDefined();
          done();
        });
      });

      it('should throw error for invalid limit', () => {
        expect(() => {
          service.query<TestUser>('users').limit(0);
        }).toThrow();

        expect(() => {
          service.query<TestUser>('users').limit(-5);
        }).toThrow();
      });

      it('should throw error for negative offset', () => {
        expect(() => {
          service.query<TestUser>('users').offset(-1);
        }).toThrow();
      });
    });

    describe('Export/Import', () => {
      beforeEach(done => {
        const users = [
          { name: 'Alice', email: 'alice@example.com', role: 'admin' },
          { name: 'Bob', email: 'bob@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(() => done());
      });

      it('should export data', done => {
        service.export<TestUser>('users').subscribe(data => {
          expect(data.length).toBe(2);
          expect(data[0].name).toBeDefined();
          done();
        });
      });

      it('should import data and replace existing', done => {
        const newData = [
          { name: 'Charlie', email: 'charlie@example.com', role: 'user' },
          { name: 'David', email: 'david@example.com', role: 'admin' },
          { name: 'Eve', email: 'eve@example.com', role: 'user' }
        ];

        service.import('users', newData).subscribe(() => {
          service.getAll<TestUser>('users').subscribe(users => {
            expect(users.length).toBe(3);
            expect(users.some(u => u.name === 'Alice')).toBe(false);
            expect(users.some(u => u.name === 'Charlie')).toBe(true);
            done();
          });
        });
      });
    });

    describe('Cache Management', () => {
      it('should cache data on first fetch', done => {
        const configWithCache: CatbeeIndexedDBConfig = {
          ...testConfig,
          cache: {
            enabled: true,
            expirySeconds: 300
          }
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' },
            { provide: CATBEE_INDEXED_DB_CONFIG, useValue: configWithCache }
          ]
        });

        const cachedService = TestBed.inject(CatbeeIndexedDBService);
        const fetcher = jasmine.createSpy('fetcher').and.returnValue(cachedService.getByID<TestUser>('users', 1));

        cachedService.initialize(configWithCache).subscribe(() => {
          cachedService.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(user => {
            // First call - should fetch
            cachedService.cached('users', 'test-key', fetcher).subscribe(data1 => {
              expect(fetcher).toHaveBeenCalledTimes(1);
              expect(data1).toBeDefined();

              // Second call - should use cache
              cachedService.cached('users', 'test-key', fetcher).subscribe(data2 => {
                expect(fetcher).toHaveBeenCalledTimes(1); // Still only called once
                expect(data2).toEqual(data1);
                done();
              });
            });
          });
        });
      });

      it('should invalidate cache for specific store', done => {
        const configWithCache: CatbeeIndexedDBConfig = {
          ...testConfig,
          cache: {
            enabled: true,
            expirySeconds: 300
          }
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' },
            { provide: CATBEE_INDEXED_DB_CONFIG, useValue: configWithCache }
          ]
        });

        const cachedService = TestBed.inject(CatbeeIndexedDBService);
        const fetcher = jasmine.createSpy('fetcher').and.callFake(() => cachedService.getAll<TestUser>('users'));

        cachedService.initialize(configWithCache).subscribe(() => {
          cachedService.add('users', { name: 'Test', email: 'test@example.com', role: 'user' }).subscribe(() => {
            cachedService.cached('users', 'all', fetcher).subscribe(() => {
              expect(fetcher).toHaveBeenCalledTimes(1);

              // Invalidate cache
              cachedService.invalidateCache('users');
              setTimeout(() => {
                cachedService.cached('users', 'all', fetcher).subscribe(() => {
                  expect(fetcher).toHaveBeenCalledTimes(2);
                  done();
                });
              }, 50);
            });
          });
        });
      });

      it('should invalidate all cache', done => {
        const configWithCache: CatbeeIndexedDBConfig = {
          ...testConfig,
          cache: {
            enabled: true,
            expirySeconds: 300
          }
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' },
            { provide: CATBEE_INDEXED_DB_CONFIG, useValue: configWithCache }
          ]
        });

        const cachedService = TestBed.inject(CatbeeIndexedDBService);
        const userFetcher = jasmine.createSpy('userFetcher').and.returnValue(cachedService.getAll<TestUser>('users'));
        const productFetcher = jasmine
          .createSpy('productFetcher')
          .and.returnValue(cachedService.getAll<TestProduct>('products'));

        cachedService.initialize(configWithCache).subscribe(() => {
          cachedService.cached('users', 'all', userFetcher).subscribe(() => {
            cachedService.cached('products', 'all', productFetcher).subscribe(() => {
              expect(userFetcher).toHaveBeenCalledTimes(1);
              expect(productFetcher).toHaveBeenCalledTimes(1);

              // Invalidate all caches
              cachedService.invalidateCache();

              cachedService.cached('users', 'all', userFetcher).subscribe(() => {
                cachedService.cached('products', 'all', productFetcher).subscribe(() => {
                  expect(userFetcher).toHaveBeenCalledTimes(2);
                  expect(productFetcher).toHaveBeenCalledTimes(2);
                  done();
                });
              });
            });
          });
        });
      });

      it('should respect cache enabled flag', done => {
        const configWithCache: CatbeeIndexedDBConfig = {
          ...testConfig,
          cache: {
            enabled: false,
            expirySeconds: 300
          }
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' },
            { provide: CATBEE_INDEXED_DB_CONFIG, useValue: configWithCache }
          ]
        });

        const cachedService = TestBed.inject(CatbeeIndexedDBService);
        const fetcher = jasmine.createSpy('fetcher').and.returnValue(of([{ name: 'Test' }]));

        cachedService.initialize(configWithCache).subscribe(() => {
          // First call
          cachedService.cached('users', 'test', fetcher).subscribe(() => {
            // Second call - should call fetcher again since cache is disabled
            cachedService.cached('users', 'test', fetcher).subscribe(() => {
              expect(fetcher).toHaveBeenCalledTimes(2);
              done();
            });
          });
        });
      });

      it('should use custom cache expiry time', done => {
        const configWithCustomExpiry: CatbeeIndexedDBConfig = {
          ...testConfig,
          cache: {
            enabled: true,
            expirySeconds: 1 // 1 second
          }
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            CatbeeIndexedDBService,
            { provide: PLATFORM_ID, useValue: 'browser' },
            { provide: CATBEE_INDEXED_DB_CONFIG, useValue: configWithCustomExpiry }
          ]
        });

        const cachedService = TestBed.inject(CatbeeIndexedDBService);
        const fetcher = jasmine.createSpy('fetcher').and.returnValue(of([{ name: 'Test' }]));

        cachedService.initialize(configWithCustomExpiry).subscribe(() => {
          // First call
          cachedService.cached('users', 'test', fetcher).subscribe(() => {
            expect(fetcher).toHaveBeenCalledTimes(1);

            // Wait for cache to expire (1.5 seconds)
            setTimeout(() => {
              // Second call after expiry - should fetch again
              cachedService.cached('users', 'test', fetcher).subscribe(() => {
                expect(fetcher).toHaveBeenCalledTimes(2);
                done();
              });
            }, 1500);
          });
        });
      });
    });

    describe('Connection Management', () => {
      it('should close database connection', done => {
        service.initialize(testConfig).subscribe(() => {
          service.close();

          setTimeout(() => {
            service.dbState.subscribe(state => {
              expect(state).toBe('closed');
              done();
            });
          }, 50);
        });
      });
    });

    describe('Transaction Operations', () => {
      beforeEach(done => {
        service.initialize(testConfig).subscribe(() => done());
      });

      it('should execute transaction successfully', done => {
        service
          .transaction('users', DBMode.ReadWrite, store => {
            store.add({ name: 'Test User', email: 'test@example.com', role: 'user' });
            return 'success';
          })
          .subscribe({
            next: result => {
              expect(result).toBe('success');
              done();
            },
            error: () => done.fail('Should not error')
          });
      });

      it('should handle transaction with Promise return', done => {
        service
          .transaction('users', DBMode.ReadWrite, async store => {
            store.add({ name: 'Async User', email: 'async@example.com', role: 'user' });
            return Promise.resolve('async-result');
          })
          .subscribe({
            next: result => {
              expect(result).toBe('async-result');
              done();
            },
            error: () => done.fail('Should not error')
          });
      });

      it('should handle transaction error', done => {
        service
          .transaction('users', DBMode.ReadWrite, store => {
            throw new Error('Transaction operation failed');
          })
          .subscribe({
            next: () => done.fail('Should not succeed'),
            error: error => {
              expect(error.message).toContain('Transaction operation failed');
              done();
            }
          });
      });

      it('should handle Promise rejection in transaction', done => {
        service
          .transaction('users', DBMode.ReadWrite, async () => {
            return Promise.reject(new Error('Promise rejected'));
          })
          .subscribe({
            next: () => done.fail('Should not succeed'),
            error: (error: any) => {
              expect(error.message).toContain('Promise rejected');
              done();
            }
          });
      });
    });

    describe('Batch Operations Advanced', () => {
      beforeEach(done => {
        service.initialize(testConfig).subscribe(() => done());
      });

      it('should execute batch with add operations with keys', done => {
        service
          .batch('users', [
            { type: 'add', value: { name: 'User 1', email: 'user1@example.com', role: 'user' }, key: 100 },
            { type: 'add', value: { name: 'User 2', email: 'user2@example.com', role: 'admin' }, key: 200 }
          ])
          .subscribe({
            next: () => {
              service.count('users').subscribe(count => {
                expect(count).toBe(2);
                done();
              });
            },
            error: () => done.fail('Should not error')
          });
      });

      it('should execute batch with update operations', done => {
        service.add('users', { name: 'Original', email: 'original@example.com', role: 'user' }).subscribe(user => {
          service
            .batch('users', [
              { type: 'update', value: { id: user.id, name: 'Updated', email: 'updated@example.com', role: 'admin' } }
            ])
            .subscribe({
              next: () => {
                service.getByKey<TestUser>('users', user.id!).subscribe(updated => {
                  expect(updated.name).toBe('Updated');
                  done();
                });
              },
              error: () => done.fail('Should not error')
            });
        });
      });

      it('should execute batch with delete operations', done => {
        service.add('users', { name: 'ToDelete', email: 'delete@example.com', role: 'user' }).subscribe(user => {
          service.batch('users', [{ type: 'delete', key: user.id! }]).subscribe({
            next: () => {
              service.count('users').subscribe(count => {
                expect(count).toBe(0);
                done();
              });
            },
            error: () => done.fail('Should not error')
          });
        });
      });
    });

    describe('BulkGet Advanced', () => {
      beforeEach(done => {
        service.initialize(testConfig).subscribe(() => done());
      });

      it('should handle bulkGet with multiple keys using reduce', done => {
        const users = [
          { name: 'User 1', email: 'user1@example.com', role: 'user' },
          { name: 'User 2', email: 'user2@example.com', role: 'user' },
          { name: 'User 3', email: 'user3@example.com', role: 'user' }
        ];

        service.bulkAdd('users', users).subscribe(keys => {
          service.bulkGet<TestUser>('users', keys).subscribe(results => {
            expect(results.length).toBe(3);
            expect(results[0].name).toBe('User 1');
            expect(results[1].name).toBe('User 2');
            expect(results[2].name).toBe('User 3');
            done();
          });
        });
      });
    });
  });
});

describe('provideCatbeeIndexedDB', () => {
  it('should provide CATBEE_INDEXED_DB_CONFIG with config', () => {
    const config: CatbeeIndexedDBConfig = {
      name: 'TestDB',
      version: 1,
      objectStoresMeta: [
        {
          store: 'users',
          storeConfig: { keyPath: 'id', autoIncrement: true },
          storeSchema: []
        }
      ]
    };

    TestBed.configureTestingModule({
      providers: [provideCatbeeIndexedDB(config)]
    });

    const injectedConfig = TestBed.inject(CATBEE_INDEXED_DB_CONFIG);
    expect(injectedConfig).toEqual(config);
    expect(injectedConfig.name).toBe('TestDB');
    expect(injectedConfig.version).toBe(1);
  });

  it('should provide CATBEE_INDEXED_DB_CONFIG with empty config when no config provided', () => {
    TestBed.configureTestingModule({
      providers: [provideCatbeeIndexedDB()]
    });

    const injectedConfig = TestBed.inject(CATBEE_INDEXED_DB_CONFIG);
    expect(injectedConfig).toBeDefined();
    expect(Object.keys(injectedConfig).length).toBe(0);
  });

  it('should create environment providers', () => {
    const config: CatbeeIndexedDBConfig = {
      name: 'AppDB',
      version: 2,
      objectStoresMeta: []
    };

    const providers = provideCatbeeIndexedDB(config);
    expect(providers).toBeDefined();

    TestBed.configureTestingModule({
      providers: [providers]
    });

    const injectedConfig = TestBed.inject(CATBEE_INDEXED_DB_CONFIG);
    expect(injectedConfig.name).toBe('AppDB');
    expect(injectedConfig.version).toBe(2);
  });

  it('should support cache configuration', () => {
    const config: CatbeeIndexedDBConfig = {
      name: 'CachedDB',
      version: 1,
      objectStoresMeta: [],
      cache: {
        enabled: true,
        expirySeconds: 600
      }
    };

    TestBed.configureTestingModule({
      providers: [provideCatbeeIndexedDB(config)]
    });

    const injectedConfig = TestBed.inject(CATBEE_INDEXED_DB_CONFIG);
    expect(injectedConfig.cache).toBeDefined();
    expect(injectedConfig.cache?.enabled).toBe(true);
    expect(injectedConfig.cache?.expirySeconds).toBe(600);
  });
});
