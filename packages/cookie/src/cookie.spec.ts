import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { CookieService } from './cookie.service';
import { CookieOptions } from './cookie.types';

describe('CookieService', () => {
  let service: CookieService;
  let mockDocument: Partial<Document>;

  beforeEach(() => {
    // Create a mock document with a cookie property
    mockDocument = {
      cookie: ''
    };

    TestBed.configureTestingModule({
      providers: [CookieService, { provide: DOCUMENT, useValue: mockDocument }]
    });

    service = TestBed.inject(CookieService);
  });

  afterEach(() => {
    // Clean up cookies
    mockDocument.cookie = '';
  });

  // Helper function to create error document and service
  function setupErrorDocument(cookieGetter: () => string, cookieSetter: (value: string) => void): CookieService {
    const errorDocument = {
      get cookie() {
        return cookieGetter();
      },
      set cookie(value: string) {
        cookieSetter(value);
      }
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CookieService, { provide: DOCUMENT, useValue: errorDocument }]
    });

    return TestBed.inject(CookieService);
  }

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('set', () => {
    it('should set a cookie with default options', () => {
      service.set('testKey', 'testValue');
      expect(mockDocument.cookie).toContain('testKey=');
      expect(mockDocument.cookie).toContain('testValue');
    });

    it('should set a cookie with custom expiration days', () => {
      service.set('testKey', 'testValue', { expires: 30 });
      expect(mockDocument.cookie).toContain('testKey=');
    });

    it('should set a cookie with Date expiration', () => {
      const futureDate = new Date(Date.now() + 86400000); // 1 day
      service.set('testKey', 'testValue', { expires: futureDate });
      expect(mockDocument.cookie).toContain('testKey=');
    });

    it('should set a cookie with custom path', () => {
      service.set('testKey', 'testValue', { path: '/custom' });
      expect(mockDocument.cookie).toContain('Path=/custom');
    });

    it('should set a secure cookie', () => {
      service.set('testKey', 'testValue', { secure: true });
      expect(mockDocument.cookie).toContain('Secure');
    });

    it('should set a cookie with sameSite attribute', () => {
      service.set('testKey', 'testValue', { sameSite: 'Lax' });
      expect(mockDocument.cookie).toContain('SameSite=Lax');
    });

    it('should set a cookie with all options', () => {
      const options: CookieOptions = {
        expires: 15,
        path: '/app',
        secure: true,
        sameSite: 'Strict'
      };
      service.set('testKey', 'testValue', options);
      expect(mockDocument.cookie).toContain('testKey=');
      expect(mockDocument.cookie).toContain('Path=/app');
      expect(mockDocument.cookie).toContain('Secure');
      expect(mockDocument.cookie).toContain('SameSite=Strict');
    });

    it('should auto-enable Secure when SameSite=None', () => {
      const spy = spyOn(console, 'warn');
      service.set('testKey', 'testValue', { sameSite: 'None' });
      expect(mockDocument.cookie).toContain('Secure');
      expect(spy).toHaveBeenCalledWith(
        'Cookie "testKey" with SameSite=None requires Secure. Secure enabled automatically.'
      );
    });

    it('should not warn when SameSite=None with secure:true', () => {
      const spy = spyOn(console, 'warn');
      service.set('testKey', 'testValue', { sameSite: 'None', secure: true });
      expect(mockDocument.cookie).toContain('Secure');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set partitioned cookie', () => {
      service.set('testKey', 'testValue', { partitioned: true });
      expect(mockDocument.cookie).toContain('Partitioned');
    });

    it('should URL encode special characters', () => {
      service.set('testKey', 'hello world!@#$%');
      expect(mockDocument.cookie).toContain('hello%20world!%40%23%24%25');
    });
  });

  describe('set error handling', () => {
    it('should handle errors gracefully', () => {
      const errorService = setupErrorDocument(
        () => '',
        () => {
          throw new Error('Cookie write failed');
        }
      );
      const spy = spyOn(console, 'error');

      errorService.set('testKey', 'testValue');

      expect(spy).toHaveBeenCalledWith('Failed to set cookie "testKey":', jasmine.any(Error));
    });
  });

  describe('setIfNotExists', () => {
    it('should set cookie if it does not exist', () => {
      service.setIfNotExists('newKey', 'newValue');
      const value = service.get('newKey');
      expect(value).toBe('newValue');
    });

    it('should not overwrite existing cookie', () => {
      mockDocument.cookie = 'existingKey=existingValue';
      service.setIfNotExists('existingKey', 'newValue');
      const value = service.get('existingKey');
      expect(value).toBe('existingValue');
    });
  });

  describe('get', () => {
    it('should retrieve a cookie value', () => {
      mockDocument.cookie = 'testKey=testValue';
      const value = service.get('testKey');
      expect(value).toBe('testValue');
    });

    it('should return null if cookie does not exist', () => {
      const value = service.get('nonExistent');
      expect(value).toBeNull();
    });

    it('should decode cookie values by default', () => {
      mockDocument.cookie = 'testKey=test%20value';
      const value = service.get('testKey');
      expect(value).toBe('test value');
    });

    it('should handle multiple cookies', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';
      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toBe('value2');
      expect(service.get('key3')).toBe('value3');
    });

    it('should handle empty cookie string', () => {
      mockDocument.cookie = '';
      const value = service.get('testKey');
      expect(value).toBeNull();
    });
  });

  describe('get error handling', () => {
    it('should handle errors gracefully', () => {
      const errorService = setupErrorDocument(
        () => {
          throw new Error('Cookie read failed');
        },
        () => {}
      );
      const spy = spyOn(console, 'error');

      const value = errorService.get('testKey');

      expect(value).toBeNull();
      expect(spy).toHaveBeenCalledWith('Failed to get cookie "testKey":', jasmine.any(Error));
    });
  });

  describe('getAll', () => {
    it('should retrieve all cookies as an object', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';
      const allCookies = service.getAll();
      expect(allCookies).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });

    it('should return empty object when no cookies exist', () => {
      mockDocument.cookie = '';
      const allCookies = service.getAll();
      expect(allCookies).toEqual({});
    });

    it('should decode all cookie values', () => {
      mockDocument.cookie = 'key1=value%201; key2=value%202';
      const allCookies = service.getAll();
      expect(allCookies).toEqual({
        key1: 'value 1',
        key2: 'value 2'
      });
    });
  });

  describe('getAll error handling', () => {
    it('should handle errors gracefully', () => {
      const errorService = setupErrorDocument(
        () => {
          throw new Error('Cookie read failed');
        },
        () => {}
      );
      const spy = spyOn(console, 'error');

      const result = errorService.getAll();

      expect(result).toEqual({});
      expect(spy).toHaveBeenCalledWith('Failed to get all cookies:', jasmine.any(Error));
    });
  });

  describe('getJson', () => {
    it('should retrieve and parse JSON value', () => {
      const obj = { name: 'John', age: 30 };
      mockDocument.cookie = `userData=${encodeURIComponent(JSON.stringify(obj))}`;
      const result = service.getJson('userData');
      expect(result).toEqual(obj);
    });

    it('should return null if cookie does not exist', () => {
      const result = service.getJson('preferences');
      expect(result).toBeNull();
    });

    it('should return null if JSON parsing fails', () => {
      const spy = spyOn(console, 'error');
      mockDocument.cookie = 'invalidJson=not-json';
      const result = service.getJson('invalidJson');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle complex nested objects', () => {
      const complexObj = {
        user: { name: 'John', roles: ['admin', 'user'] },
        settings: { theme: 'dark', notifications: true }
      };
      mockDocument.cookie = `config=${encodeURIComponent(JSON.stringify(complexObj))}`;
      const result = service.getJson('config');
      expect(result).toEqual(complexObj);
    });
  });

  describe('setJson', () => {
    it('should stringify and store JSON value', () => {
      const obj = { name: 'John', age: 30 };
      service.setJson('userData', obj);
      const retrieved = service.getJson('userData');
      expect(retrieved).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      service.setJson<number[]>('numbers', arr);
      const retrieved = service.getJson<number[]>('numbers');
      expect(retrieved).toEqual(arr);
    });

    it('should handle null values', () => {
      service.setJson('nullValue', null);
      const retrieved = service.getJson<null | string>('nullValue');
      expect(retrieved).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const spy = spyOn(console, 'error');
      const circularObj: any = { prop: 'value' };
      circularObj.circular = circularObj; // Create circular reference

      service.setJson('circular', circularObj);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getArray', () => {
    it('should retrieve and parse array', () => {
      const arr = ['item1', 'item2', 'item3'];
      mockDocument.cookie = `items=${encodeURIComponent(JSON.stringify(arr))}`;
      const result = service.getArray<string>('items');
      expect(result).toEqual(arr);
    });

    it('should return null if cookie does not exist', () => {
      const result = service.getArray('items');
      expect(result).toBeNull();
    });

    it('should return null if value is not an array', () => {
      mockDocument.cookie = `notArray=${encodeURIComponent(JSON.stringify({ key: 'value' }))}`;
      const result = service.getArray('notArray');
      expect(result).toBeNull();
    });

    it('should return null if cookie not found', () => {
      const result = service.getArray('nonExistent');
      expect(result).toBeNull();
    });

    it('should handle numeric arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      mockDocument.cookie = `numbers=${encodeURIComponent(JSON.stringify(arr))}`;
      const result = service.getArray<number>('numbers');
      expect(result).toEqual(arr);
    });

    it('should handle parsing errors', () => {
      const spy = spyOn(console, 'error');
      mockDocument.cookie = 'invalidArray=not-json';
      const result = service.getArray('invalidArray');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('setArray', () => {
    it('should store array as JSON', () => {
      const arr = ['a', 'b', 'c'];
      service.setArray('letters', arr);
      const retrieved = service.getArray<string>('letters');
      expect(retrieved).toEqual(arr);
    });

    it('should handle complex object arrays', () => {
      const arr = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];
      service.setArray('items', arr);
      const retrieved = service.getArray<{ id: number; name: string }>('items');
      expect(retrieved).toEqual(arr);
    });
  });

  describe('getJsonWithDefault', () => {
    it('should return existing JSON value without setting', () => {
      const obj = { theme: 'dark', lang: 'en' };
      service.setJson('prefs', obj);
      const result = service.getJsonWithDefault('prefs', { theme: 'light', lang: 'fr' });
      expect(result).toEqual(obj);
      // Verify it didn't overwrite
      expect(service.getJson('prefs')).toEqual(obj);
    });

    it('should set and return default if cookie does not exist', () => {
      const defaultValue = { theme: 'light', lang: 'en' };
      const result = service.getJsonWithDefault('prefs', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(service.getJson('prefs')).toEqual(defaultValue);
    });

    it('should set and return default if JSON is invalid', () => {
      const spy = spyOn(console, 'error');
      mockDocument.cookie = 'prefs=invalid-json';
      const defaultValue = { theme: 'light' };
      const result = service.getJsonWithDefault('prefs', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(service.getJson('prefs')).toEqual(defaultValue);
      expect(spy).toHaveBeenCalled();
    });

    it('should use provided options when setting default', () => {
      const defaultValue = { theme: 'dark' };
      const options: CookieOptions = { expires: 30, secure: true };
      const result = service.getJsonWithDefault('prefs', defaultValue, options);
      expect(result).toEqual(defaultValue);
      expect(mockDocument.cookie).toContain('Secure');
    });

    it('should handle null values', () => {
      service.setJson('data', null);
      const result = service.getJsonWithDefault('data', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('getArrayWithDefault', () => {
    it('should return existing array value without setting', () => {
      const arr = ['apple', 'banana', 'cherry'];
      service.setArray('fruits', arr);
      const result = service.getArrayWithDefault('fruits', ['default']);
      expect(result).toEqual(arr);
      // Verify it didn't overwrite
      expect(service.getArray('fruits')).toEqual(arr);
    });

    it('should set and return default if cookie does not exist', () => {
      const defaultValue = ['item1', 'item2'];
      const result = service.getArrayWithDefault('items', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(service.getArray('items')).toEqual(defaultValue);
    });

    it('should set and return default if value is not an array', () => {
      mockDocument.cookie = `data=${encodeURIComponent(JSON.stringify({ key: 'value' }))}`;
      const defaultValue = ['fallback'];
      const result = service.getArrayWithDefault('data', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(service.getArray('data')).toEqual(defaultValue);
    });

    it('should set and return default if parsing fails', () => {
      const spy = spyOn(console, 'error');
      mockDocument.cookie = 'items=invalid-json';
      const defaultValue = ['default1', 'default2'];
      const result = service.getArrayWithDefault('items', defaultValue);
      expect(result).toEqual(defaultValue);
      expect(service.getArray('items')).toEqual(defaultValue);
      expect(spy).toHaveBeenCalled();
    });

    it('should use provided options when setting default', () => {
      const defaultValue = [1, 2, 3];
      const options: CookieOptions = { expires: 7, path: '/app' };
      const result = service.getArrayWithDefault('numbers', defaultValue, options);
      expect(result).toEqual(defaultValue);
      expect(mockDocument.cookie).toContain('Path=/app');
    });

    it('should handle empty arrays', () => {
      service.setArray('empty', []);
      const result = service.getArrayWithDefault('empty', ['default']);
      expect(result).toEqual([]);
    });
  });

  describe('updateJson', () => {
    it('should merge updates with existing value', () => {
      const initial = { name: 'John', age: 30, role: 'user' };
      service.setJson('user', initial);

      service.updateJson('user', { age: 31, role: 'admin' }, initial);

      const result = service.getJson('user');
      expect(result).toEqual({ name: 'John', age: 31, role: 'admin' });
    });

    it('should use default value if cookie does not exist', () => {
      const defaultValue = { theme: 'light', lang: 'en' };
      service.updateJson('settings', { theme: 'dark' }, defaultValue);

      const result = service.getJson('settings');
      expect(result).toEqual({ theme: 'dark', lang: 'en' });
    });

    it('should perform shallow merge', () => {
      const initial = { nested: { a: 1, b: 2 }, top: 'value' };
      service.setJson('data', initial);

      service.updateJson('data', { nested: { a: 10, b: 2 } }, initial);

      const result = service.getJson<any>('data');
      expect(result.nested).toEqual({ a: 10, b: 2 }); // Shallow merge replaces nested object
      expect(result.top).toBe('value');
    });
  });

  describe('getWithDefault', () => {
    it('should return cookie value if it exists', () => {
      mockDocument.cookie = 'theme=dark';
      const result = service.getWithDefault('theme', 'light');
      expect(result).toBe('dark');
    });

    it('should set and return default if cookie does not exist', () => {
      const result = service.getWithDefault('theme', 'light');
      expect(result).toBe('light');
      expect(service.get('theme')).toBe('light');
    });

    it('should validate against allowed values', () => {
      mockDocument.cookie = 'theme=rainbow';
      const result = service.getWithDefault('theme', 'light', ['light', 'dark']);
      expect(result).toBe('light'); // Invalid value, returns default
      expect(service.get('theme')).toBe('light');
    });

    it('should accept valid values from allowed list', () => {
      mockDocument.cookie = 'theme=dark';
      const result = service.getWithDefault('theme', 'light', ['light', 'dark']);
      expect(result).toBe('dark');
    });

    it('should accept any value if allowed values is empty', () => {
      mockDocument.cookie = 'theme=rainbow';
      const result = service.getWithDefault('theme', 'light', []);
      expect(result).toBe('rainbow');
    });
  });

  describe('getBoolean', () => {
    it('should parse truthy values', () => {
      mockDocument.cookie = 'enabled=true';
      expect(service.getBoolean('enabled')).toBe(true);

      mockDocument.cookie = 'enabled=1';
      expect(service.getBoolean('enabled')).toBe(true);

      mockDocument.cookie = 'enabled=yes';
      expect(service.getBoolean('enabled')).toBe(true);

      mockDocument.cookie = 'enabled=on';
      expect(service.getBoolean('enabled')).toBe(true);
    });

    it('should parse falsy values', () => {
      mockDocument.cookie = 'enabled=false';
      expect(service.getBoolean('enabled')).toBe(false);

      mockDocument.cookie = 'enabled=0';
      expect(service.getBoolean('enabled')).toBe(false);

      mockDocument.cookie = 'enabled=no';
      expect(service.getBoolean('enabled')).toBe(false);

      mockDocument.cookie = 'enabled=off';
      expect(service.getBoolean('enabled')).toBe(false);
    });

    it('should return false for invalid values', () => {
      mockDocument.cookie = 'enabled=maybe';
      const result = service.getBoolean('enabled');
      expect(result).toBe(false);
    });

    it('should return false if cookie does not exist', () => {
      const result = service.getBoolean('enabled');
      expect(result).toBe(false);
    });

    it('should be case insensitive', () => {
      mockDocument.cookie = 'enabled=TRUE';
      const result = service.getBoolean('enabled');
      expect(result).toBe(true);
    });
  });

  describe('getBooleanWithDefault', () => {
    it('should parse truthy values and not set cookie', () => {
      mockDocument.cookie = 'enabled=true';
      expect(service.getBooleanWithDefault('enabled', false)).toBe(true);

      mockDocument.cookie = 'enabled=1';
      expect(service.getBooleanWithDefault('enabled', false)).toBe(true);
    });

    it('should parse falsy values and not set cookie', () => {
      mockDocument.cookie = 'enabled=false';
      expect(service.getBooleanWithDefault('enabled', true)).toBe(false);

      mockDocument.cookie = 'enabled=0';
      expect(service.getBooleanWithDefault('enabled', true)).toBe(false);
    });

    it('should set and return default for invalid values', () => {
      mockDocument.cookie = 'enabled=maybe';
      const result = service.getBooleanWithDefault('enabled', true);
      expect(result).toBe(true);
      expect(service.get('enabled')).toBe('true');
    });

    it('should set and return default if cookie does not exist', () => {
      const result = service.getBooleanWithDefault('enabled', false);
      expect(result).toBe(false);
      expect(service.get('enabled')).toBe('false');
    });

    it('should be case insensitive', () => {
      mockDocument.cookie = 'enabled=TRUE';
      const result = service.getBooleanWithDefault('enabled', false);
      expect(result).toBe(true);
    });

    it('should use provided options when setting default', () => {
      const options: CookieOptions = { expires: 30, secure: true };
      const result = service.getBooleanWithDefault('feature', true, options);
      expect(result).toBe(true);
      expect(mockDocument.cookie).toContain('Secure');
    });
  });

  describe('getNumber', () => {
    it('should parse numeric values', () => {
      mockDocument.cookie = 'count=42';
      expect(service.getNumber('count')).toBe(42);

      mockDocument.cookie = 'price=19.99';
      expect(service.getNumber('price')).toBe(19.99);

      mockDocument.cookie = 'temperature=-5.5';
      expect(service.getNumber('temperature')).toBe(-5.5);

      mockDocument.cookie = 'value=1e3';
      expect(service.getNumber('value')).toBe(1000);
    });

    it('should return NaN for non-numeric values', () => {
      mockDocument.cookie = 'count=abc';
      const result = service.getNumber('count');
      expect(result).toBeNaN();
    });

    it('should return NaN if cookie does not exist', () => {
      const result = service.getNumber('count');
      expect(result).toBeNaN();
    });

    it('should handle zero', () => {
      mockDocument.cookie = 'count=0';
      const result = service.getNumber('count');
      expect(result).toBe(0);
    });
  });

  describe('getNumberWithDefault', () => {
    it('should parse numeric values and not set cookie', () => {
      mockDocument.cookie = 'count=42';
      expect(service.getNumberWithDefault('count', 0)).toBe(42);

      mockDocument.cookie = 'price=19.99';
      expect(service.getNumberWithDefault('price', 0)).toBe(19.99);

      mockDocument.cookie = 'temperature=-5.5';
      expect(service.getNumberWithDefault('temperature', 0)).toBe(-5.5);

      mockDocument.cookie = 'value=1e3';
      expect(service.getNumberWithDefault('value', 0)).toBe(1000);
    });

    it('should set and return default for non-numeric values', () => {
      mockDocument.cookie = 'count=abc';
      const result = service.getNumberWithDefault('count', 10);
      expect(result).toBe(10);
      expect(service.get('count')).toBe('10');
    });

    it('should set and return default if cookie does not exist', () => {
      const result = service.getNumberWithDefault('count', 5);
      expect(result).toBe(5);
      expect(service.get('count')).toBe('5');
    });

    it('should handle zero', () => {
      mockDocument.cookie = 'count=0';
      const result = service.getNumberWithDefault('count', 10);
      expect(result).toBe(0);
    });

    it('should use provided options when setting default', () => {
      const options: CookieOptions = { expires: 30, secure: true };
      const result = service.getNumberWithDefault('count', 100, options);
      expect(result).toBe(100);
      expect(mockDocument.cookie).toContain('Secure');
    });

    it('should handle Infinity by setting default', () => {
      mockDocument.cookie = 'value=Infinity';
      const result = service.getNumberWithDefault('value', 0);
      expect(result).toBe(0);
      expect(service.get('value')).toBe('0');
    });

    it('should handle -Infinity by setting default', () => {
      mockDocument.cookie = 'value=-Infinity';
      const result = service.getNumberWithDefault('value', 0);
      expect(result).toBe(0);
      expect(service.get('value')).toBe('0');
    });
  });

  describe('getEnum', () => {
    type Theme = 'light' | 'dark' | 'auto';
    const themes: readonly Theme[] = ['light', 'dark', 'auto'];

    it('should return valid enum value', () => {
      mockDocument.cookie = 'theme=dark';
      const result = service.getEnum('theme', themes);
      expect(result).toBe('dark');
    });

    it('should return null for invalid enum value', () => {
      mockDocument.cookie = 'theme=rainbow';
      const result = service.getEnum('theme', themes);
      expect(result).toBeNull();
    });

    it('should return null if cookie does not exist', () => {
      const result = service.getEnum('theme', themes);
      expect(result).toBeNull();
    });

    it('should handle numeric enums as strings', () => {
      type Status = '0' | '1' | '2';
      const statuses: readonly Status[] = ['0', '1', '2'];
      mockDocument.cookie = 'status=1';
      const result = service.getEnum('status', statuses);
      expect(result).toBe('1');
    });
  });

  describe('getEnumWithDefault', () => {
    type Theme = 'light' | 'dark' | 'auto';
    const themes: readonly Theme[] = ['light', 'dark', 'auto'];

    it('should return valid enum value', () => {
      mockDocument.cookie = 'theme=dark';
      const result = service.getEnumWithDefault('theme', 'light', themes);
      expect(result).toBe('dark');
    });

    it('should set and return default for invalid enum value', () => {
      mockDocument.cookie = 'theme=rainbow';
      const result = service.getEnumWithDefault('theme', 'light', themes);
      expect(result).toBe('light');
      expect(service.get('theme')).toBe('light');
    });

    it('should set and return default if cookie does not exist', () => {
      const result = service.getEnumWithDefault('theme', 'auto', themes);
      expect(result).toBe('auto');
      expect(service.get('theme')).toBe('auto');
    });

    it('should handle numeric enums as strings', () => {
      type Status = '0' | '1' | '2';
      const statuses: readonly Status[] = ['0', '1', '2'];
      mockDocument.cookie = 'status=1';
      const result = service.getEnumWithDefault('status', '0', statuses);
      expect(result).toBe('1');
    });

    it('should use provided options when setting default', () => {
      const options: CookieOptions = { expires: 365, secure: true };
      const result = service.getEnumWithDefault('theme', 'light', themes, options);
      expect(result).toBe('light');
      expect(mockDocument.cookie).toContain('Secure');
    });

    it('should validate against all enum values', () => {
      type Size = 'small' | 'medium' | 'large';
      const sizes: readonly Size[] = ['small', 'medium', 'large'];
      mockDocument.cookie = 'size=medium';
      const result = service.getEnumWithDefault('size', 'small', sizes);
      expect(result).toBe('medium');
    });

    it('should handle empty string as invalid', () => {
      mockDocument.cookie = 'theme=';
      const result = service.getEnumWithDefault('theme', 'light', themes);
      expect(result).toBe('light');
      expect(service.get('theme')).toBe('light');
    });
  });

  describe('has', () => {
    it('should return true if cookie exists', () => {
      mockDocument.cookie = 'testKey=testValue';
      expect(service.has('testKey')).toBe(true);
    });

    it('should return false if cookie does not exist', () => {
      expect(service.has('nonExistent')).toBe(false);
    });

    it('should return true for empty string values', () => {
      mockDocument.cookie = 'emptyKey=';
      expect(service.has('emptyKey')).toBe(true);
    });
  });

  describe('SSR compatibility', () => {
    it('should return false from has() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      // Override isAvailable to simulate SSR
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.has('anyKey')).toBe(false);
    });

    it('should return null from get() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.get('anyKey')).toBeNull();
    });

    it('should return empty array from keys() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.keys()).toEqual([]);
    });

    it('should return empty array from values() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.values()).toEqual([]);
    });

    it('should return empty array from entries() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.entries()).toEqual([]);
    });

    it('should return empty object from getAll() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getAll()).toEqual({});
    });

    it('should return null from getJson() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getJson('key')).toBeNull();
    });

    it('should return null from getArray() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getArray('key')).toBeNull();
    });

    it('should return false from getBoolean() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getBoolean('key')).toBe(false);
    });

    it('should return NaN from getNumber() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getNumber('key')).toBeNaN();
    });

    it('should return null from getEnum() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getEnum('key', ['default', 'other'] as const)).toBeNull();
    });

    it('should no-op set() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.set('key', 'value');
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op setJson() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.setJson('key', { data: 'value' });
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op setArray() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.setArray('key', ['value']);
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op delete() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.delete('key');
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op deleteAll() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.deleteAll();
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op deleteMany() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.deleteMany(['key1', 'key2']);
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op setIfNotExists() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.setIfNotExists('key', 'value');
      expect(mockDocument.cookie).toBe('');
    });

    it('should no-op updateJson() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      ssrService.updateJson('key', { old: 'newValue' }, { old: 'value' });
      expect(mockDocument.cookie).toBe('');
    });

    it('should return default from getWithDefault() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getWithDefault('key', 'default')).toBe('default');
      expect(mockDocument.cookie).toBe('');
    });

    it('should return default from getBooleanWithDefault() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getBooleanWithDefault('enabled', true)).toBe(true);
      expect(mockDocument.cookie).toBe('');
    });

    it('should return default from getNumberWithDefault() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      expect(ssrService.getNumberWithDefault('count', 42)).toBe(42);
      expect(mockDocument.cookie).toBe('');
    });

    it('should return default from getEnumWithDefault() during SSR', () => {
      const ssrService = TestBed.inject(CookieService);
      Object.defineProperty(ssrService, 'isAvailable', { get: () => false });

      type Theme = 'light' | 'dark';
      const themes: readonly Theme[] = ['light', 'dark'];
      expect(ssrService.getEnumWithDefault('theme', 'light', themes)).toBe('light');
      expect(mockDocument.cookie).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle cookie names with special characters', () => {
      mockDocument.cookie = 'my-cookie_123=value';
      expect(service.get('my-cookie_123')).toBe('value');
    });

    it('should handle cookie values with equals signs', () => {
      mockDocument.cookie = 'key=value1=value2=value3';
      expect(service.get('key')).toBe('value1=value2=value3');
    });

    it('should handle cookies with encoded equals in value', () => {
      mockDocument.cookie = 'data=' + encodeURIComponent('a=b');
      expect(service.get('data')).toBe('a=b');
    });

    it('should handle empty cookie name gracefully', () => {
      mockDocument.cookie = '=value';
      const allCookies = service.getAll();
      expect(allCookies['']).toBeUndefined();
    });

    it('should handle decoding errors gracefully in get()', () => {
      // Malformed percent encoding
      mockDocument.cookie = 'badKey=%E0%A4%A';
      const spy = spyOn(console, 'error');
      const value = service.get('badKey');
      expect(value).toBeNull();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle decoding errors in getAll()', () => {
      mockDocument.cookie = 'goodKey=value; badKey=%E0%A4%A';
      const spy = spyOn(console, 'error');
      const result = service.getAll();
      expect(result).toEqual({});
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('CookieReaderService base methods', () => {
    describe('values', () => {
      it('should return values when cookies exist', () => {
        mockDocument.cookie = 'key1=val1; key2=val2';
        const values = service.values();
        expect(values).toEqual(['val1', 'val2']);
      });

      it('should handle null values gracefully', () => {
        mockDocument.cookie = 'key1=val1';
        const values = service.values();
        expect(values).toEqual(['val1']);
      });
    });

    describe('entries', () => {
      it('should return key-value tuples', () => {
        mockDocument.cookie = 'a=1; b=2';
        const entries = service.entries();
        expect(entries).toEqual([
          ['a', '1'],
          ['b', '2']
        ]);
      });
    });

    describe('has', () => {
      it('should return true when cookie exists with value', () => {
        mockDocument.cookie = 'exists=yes';
        expect(service.has('exists')).toBe(true);
      });

      it('should return false when cookie returns null', () => {
        expect(service.has('nothere')).toBe(false);
      });
    });

    describe('getBoolean - base reader edge cases', () => {
      it('should handle undefined cookie gracefully', () => {
        const result = service.getBoolean('missing');
        expect(result).toBe(false);
      });

      it('should handle empty string cookie', () => {
        mockDocument.cookie = 'empty=';
        const result = service.getBoolean('empty');
        expect(result).toBe(false);
      });
    });

    describe('getNumber - base reader edge cases', () => {
      it('should handle empty string as NaN', () => {
        mockDocument.cookie = 'num=';
        const result = service.getNumber('num');
        expect(result).toBeNaN();
      });

      it('should handle Infinity', () => {
        mockDocument.cookie = 'inf=Infinity';
        const result = service.getNumber('inf');
        expect(result).toBe(Infinity);
      });

      it('should handle -Infinity', () => {
        mockDocument.cookie = 'ninf=-Infinity';
        const result = service.getNumber('ninf');
        expect(result).toBe(-Infinity);
      });
    });

    describe('getEnum - base reader edge cases', () => {
      it('should handle non-string values', () => {
        // When get returns null
        const result = service.getEnum('missing', ['a', 'b'] as const);
        expect(result).toBeNull();
      });

      it('should validate against enum values', () => {
        mockDocument.cookie = 'status=invalid';
        const result = service.getEnum('status', ['pending', 'active'] as const);
        expect(result).toBeNull();
      });
    });

    describe('getJson - base reader edge cases', () => {
      it('should return null when value is null', () => {
        const result = service.getJson('missing');
        expect(result).toBeNull();
      });

      it('should handle empty string cookie', () => {
        mockDocument.cookie = 'empty=';
        const result = service.getJson('empty');
        expect(result).toBeNull();
      });
    });

    describe('getArray - base reader edge cases', () => {
      it('should return null when value is null', () => {
        const result = service.getArray('missing');
        expect(result).toBeNull();
      });

      it('should return null when parsed is not array', () => {
        mockDocument.cookie = 'obj=' + encodeURIComponent(JSON.stringify({ not: 'array' }));
        const result = service.getArray('obj');
        expect(result).toBeNull();
      });

      it('should handle empty string cookie', () => {
        mockDocument.cookie = 'empty=';
        const result = service.getArray('empty');
        expect(result).toBeNull();
      });
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple cookies', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';

      service.deleteMany(['key1', 'key3']);

      // Verify delete was called with correct cookies
      expect(mockDocument.cookie).toContain('Thu, 01 Jan 1970');
    });

    it('should handle custom path', () => {
      service.deleteMany(['key1', 'key2'], { path: '/custom' });
      expect(mockDocument.cookie).toContain('Path=/custom');
    });

    it('should handle empty array', () => {
      service.set('key1', 'value1');
      service.deleteMany([]);
      expect(service.has('key1')).toBe(true);
    });
  });

  describe('keys', () => {
    it('should return all cookie names', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';
      const keys = service.keys();
      expect(keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return empty array when no cookies exist', () => {
      mockDocument.cookie = '';
      const keys = service.keys();
      expect(keys).toEqual([]);
    });
  });

  describe('keys error handling', () => {
    it('should handle errors gracefully', () => {
      const errorService = setupErrorDocument(
        () => {
          throw new Error('Cookie read failed');
        },
        () => {}
      );
      const spy = spyOn(console, 'error');

      const result = errorService.keys();

      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith('Failed to get cookie keys:', jasmine.any(Error));
    });
  });

  describe('values', () => {
    it('should return all cookie values', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';
      const values = service.values();
      expect(values).toEqual(['value1', 'value2', 'value3']);
    });

    it('should return empty array when no cookies exist', () => {
      mockDocument.cookie = '';
      const values = service.values();
      expect(values).toEqual([]);
    });

    it('should decode values', () => {
      mockDocument.cookie = 'key1=value%201; key2=value%202';
      const values = service.values();
      expect(values).toEqual(['value 1', 'value 2']);
    });
  });

  describe('entries', () => {
    it('should return all cookie entries as tuples', () => {
      mockDocument.cookie = 'key1=value1; key2=value2';
      const entries = service.entries();
      expect(entries).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2']
      ]);
    });

    it('should return empty array when no cookies exist', () => {
      mockDocument.cookie = '';
      const entries = service.entries();
      expect(entries).toEqual([]);
    });
  });

  describe('deleteAll', () => {
    it('should delete all cookies', () => {
      mockDocument.cookie = 'key1=value1; key2=value2; key3=value3';
      service.deleteAll();

      // After deleteAll, getting keys should trigger deletion
      expect(mockDocument.cookie).toContain('Thu, 01 Jan 1970');
    });

    it('should use custom path if provided', () => {
      mockDocument.cookie = 'key1=value1';
      service.deleteAll({ path: '/custom' });
      expect(mockDocument.cookie).toContain('Path=/custom');
    });
  });

  describe('deleteAll error handling', () => {
    it('should handle errors gracefully when keys() fails', () => {
      const errorService = setupErrorDocument(
        () => 'key1=value1',
        () => {
          throw new Error('Delete failed');
        }
      );
      const spy = spyOn(console, 'error');

      errorService.deleteAll();

      expect(spy).toHaveBeenCalled();
    });

    it('should handle errors gracefully when delete() fails during iteration', () => {
      let callCount = 0;
      const errorDocument = {
        get cookie() {
          return callCount === 0 ? 'key1=value1; key2=value2' : '';
        },
        set cookie(value: string) {
          callCount++;
          if (callCount === 1) {
            // First delete succeeds by incrementing callCount
            return;
          }
          throw new Error('Second delete failed');
        }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [CookieService, { provide: DOCUMENT, useValue: errorDocument }]
      });

      const errorService = TestBed.inject(CookieService);
      const spy = spyOn(console, 'error');

      errorService.deleteAll();

      // Error is caught by delete() method's own try-catch
      expect(spy).toHaveBeenCalledWith('Failed to delete cookie "key2":', jasmine.any(Error));
    });
  });

  describe('delete', () => {
    it('should delete a cookie', () => {
      service.set('testKey', 'testValue');
      service.delete('testKey');
      expect(mockDocument.cookie).toContain('Thu, 01 Jan 1970');
    });

    it('should use custom path', () => {
      service.delete('testKey', { path: '/custom' });
      expect(mockDocument.cookie).toContain('Path=/custom');
    });
  });

  describe('delete error handling', () => {
    it('should handle errors gracefully', () => {
      const errorService = setupErrorDocument(
        () => '',
        () => {
          throw new Error('Delete failed');
        }
      );
      const spy = spyOn(console, 'error');

      errorService.delete('testKey');

      expect(spy).toHaveBeenCalledWith('Failed to delete cookie "testKey":', jasmine.any(Error));
    });
  });
});
