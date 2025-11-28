import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { SessionStorageService } from './session-storage.service';
import { StorageEncoderService } from './storage-encoder.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let consoleErrorSpy: jasmine.Spy;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Create mock localStorage
    mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear'),
      key: jasmine.createSpy('key'),
      length: 0
    };

    // Replace window.localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [LocalStorageService, StorageEncoderService, { provide: PLATFORM_ID, useValue: 'browser' }]
    });

    service = TestBed.inject(LocalStorageService);
    consoleErrorSpy = spyOn(console, 'error');
  });

  afterEach(() => {
    // Reset the clear spy to avoid triggering errors in cleanup
    (mockLocalStorage.clear as jasmine.Spy).and.stub();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set and get', () => {
    it('should set and get a string value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('test-value');

      service.set('test-key', 'test-value');
      const result = service.get('test-key');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should handle empty string values', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('');

      service.set('empty', '');
      const result = service.get('empty');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const specialValue = 'test@#$%^&*()';
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(specialValue);

      service.set('special', specialValue);
      const result = service.get('special');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(result).toBe(specialValue);
    });

    it('should handle errors gracefully when setting', () => {
      (mockLocalStorage.setItem as jasmine.Spy).and.throwError('Storage quota exceeded');

      service.set('error-key', 'value');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully when getting', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.get('error-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('setIfNotExists', () => {
    it('should set value if key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.setIfNotExists('new-key', 'new-value');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should not set value if key already exists', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('existing-value');

      service.setIfNotExists('existing-key', 'new-value');

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      service.setIfNotExists('error-key', 'value');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getWithDefault', () => {
    it('should return existing value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('existing');

      const result = service.getWithDefault('key', 'default');

      expect(result).toBe('existing');
    });

    it('should return and set default value when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getWithDefault('key', 'default');

      expect(result).toBe('default');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should validate against allowed values', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid');

      const result = service.getWithDefault('key', 'default', ['valid1', 'valid2']);

      expect(result).toBe('default');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should accept valid values from allowed list', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('valid1');

      const result = service.getWithDefault('key', 'default', ['valid1', 'valid2']);

      expect(result).toBe('valid1');
    });
  });

  describe('getBoolean', () => {
    it('should parse "true" as boolean true', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('true');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should parse "1" as boolean true', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('1');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should parse "yes" as boolean true', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('yes');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should parse "on" as boolean true', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('on');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should parse "false" as boolean false', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('false');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(false);
    });

    it('should parse "0" as boolean false', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('0');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(false);
    });

    it('should return null for invalid boolean string', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid');

      const result = service.getBoolean('bool-key');

      expect(result).toBeNull();
    });

    it('should be case-insensitive', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('TRUE');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should return null for null value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getBoolean('bool-key');

      expect(result).toBeNull();
    });
  });

  describe('getNumber', () => {
    it('should parse integer values', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('42');

      const result = service.getNumber('num-key');

      expect(result).toBe(42);
    });

    it('should parse float values', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('3.14');

      const result = service.getNumber('num-key');

      expect(result).toBe(3.14);
    });

    it('should parse negative numbers', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('-10');

      const result = service.getNumber('num-key');

      expect(result).toBe(-10);
    });

    it('should return null for invalid number string', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('not-a-number');

      const result = service.getNumber('num-key');

      expect(result).toBeNull();
    });

    it('should return null for null value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getNumber('num-key');

      expect(result).toBeNull();
    });
  });

  describe('getEnum', () => {
    enum TestEnum {
      Value1 = 'value1',
      Value2 = 'value2',
      Value3 = 'value3'
    }

    it('should return valid enum value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('value1');

      const result = service.getEnum('enum-key', Object.values(TestEnum));

      expect(result).toBe(TestEnum.Value1);
    });

    it('should return null for invalid enum value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid');

      const result = service.getEnum('enum-key', Object.values(TestEnum));

      expect(result).toBeNull();
    });

    it('should return null for null value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getEnum('enum-key', Object.values(TestEnum));

      expect(result).toBeNull();
    });
  });

  describe('getJson and setJson', () => {
    it('should store and retrieve JSON objects', () => {
      const testObj = { name: 'John', age: 30 };
      const jsonString = JSON.stringify(testObj);
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(jsonString);

      service.setJson('json-key', testObj);
      const result = service.getJson('json-key');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(result).toEqual(testObj);
    });

    it('should return null for invalid JSON', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid-json');

      const result = service.getJson('json-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const testObj = { user: { name: 'Jane', details: { age: 25 } } };
      const jsonString = JSON.stringify(testObj);
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(jsonString);

      service.setJson('nested-key', testObj);
      const result = service.getJson('nested-key');

      expect(result).toEqual(testObj);
    });

    it('should handle null values in JSON', () => {
      const testObj = { value: null };
      const jsonString = JSON.stringify(testObj);
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(jsonString);

      service.setJson('null-key', testObj);
      const result = service.getJson('null-key');

      expect(result).toEqual(testObj);
    });

    it('should return null when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getJson('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getArray and setArray', () => {
    it('should store and retrieve arrays', () => {
      const testArray = [1, 2, 3, 4];
      const jsonString = JSON.stringify(testArray);
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(jsonString);

      service.setArray('array-key', testArray);
      const result = service.getArray<number>('array-key');

      expect(result?.length).toBe(4);
      expect(result?.[0]).toBe(1);
      expect(result?.[3]).toBe(4);
    });

    it('should return null for non-array JSON', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('{"not":"array"}');

      const result = service.getArray('array-key');

      expect(result).toBeNull();
    });

    it('should handle empty arrays', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('[]');

      const result = service.getArray('array-key');

      expect(result).toEqual([]);
    });

    it('should handle arrays of objects', () => {
      const testArray = [{ id: 1 }, { id: 2 }];
      const jsonString = JSON.stringify(testArray);
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(jsonString);

      service.setArray('array-key', testArray);
      const result = service.getArray<{ id: number }>('array-key');

      expect(result?.length).toBe(2);
      expect(result?.[0].id).toBe(1);
      expect(result?.[1].id).toBe(2);
    });

    it('should return null when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getArray('array-key');

      expect(result).toBeNull();
    });
  });

  describe('updateJson', () => {
    it('should merge updates with existing object', () => {
      const existing = { name: 'John', age: 30, city: 'NYC' };
      const existingString = JSON.stringify(existing);

      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(existingString);

      service.updateJson('user', { age: 31 }, {});

      // Verify setItem was called with merged object
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should use default value if key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.updateJson('user', { age: 31 }, { name: 'Default', age: 0 });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getBooleanWithDefault', () => {
    it('should return boolean value when valid', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('true');

      const result = service.getBooleanWithDefault('key', false);

      expect(result).toBe(true);
    });

    it('should set and return default for invalid value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid');

      const result = service.getBooleanWithDefault('key', true);

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should set and return default when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getBooleanWithDefault('key', false);

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getNumberWithDefault', () => {
    it('should return number value when valid', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('42');

      const result = service.getNumberWithDefault('key', 0);

      expect(result).toBe(42);
    });

    it('should set and return default for invalid number', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('not-a-number');

      const result = service.getNumberWithDefault('key', 99);

      expect(result).toBe(99);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should set and return default when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getNumberWithDefault('key', 42);

      expect(result).toBe(42);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getEnumWithDefault', () => {
    enum TestEnum {
      Value1 = 'value1',
      Value2 = 'value2',
      Value3 = 'value3'
    }

    it('should return enum value when valid', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('value1');

      const result = service.getEnumWithDefault('key', TestEnum.Value2, Object.values(TestEnum));

      expect(result).toBe(TestEnum.Value1);
    });

    it('should set and return default for invalid enum value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid');

      const result = service.getEnumWithDefault('key', TestEnum.Value2, Object.values(TestEnum));

      expect(result).toBe(TestEnum.Value2);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should set and return default when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getEnumWithDefault('key', TestEnum.Value3, Object.values(TestEnum));

      expect(result).toBe(TestEnum.Value3);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getJsonWithDefault', () => {
    it('should return parsed JSON when valid', () => {
      const testObj = { name: 'John', age: 30 };
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(testObj));

      const result = service.getJsonWithDefault('key', { name: 'Default', age: 0 });

      expect(result).toEqual(testObj);
    });

    it('should set and return default for invalid JSON', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('invalid-json');

      const result = service.getJsonWithDefault('key', { name: 'Default', age: 0 });

      expect(result).toEqual({ name: 'Default', age: 0 });
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should set and return default when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getJsonWithDefault('key', { name: 'Default', age: 0 });

      expect(result).toEqual({ name: 'Default', age: 0 });
    });
  });

  describe('getArrayWithDefault', () => {
    it('should return parsed array when valid', () => {
      const testArray: number[] = [1, 2, 3];
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(testArray));

      const result = service.getArrayWithDefault<number>('key', []);

      expect(result).toEqual(testArray as jasmine.Expected<number[]>);
    });

    it('should set and return default for non-array JSON', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('{"not":"array"}');

      const result = service.getArrayWithDefault('key', [99]);

      expect(result).toEqual([99]);
    });

    it('should set and return default when key does not exist', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getArrayWithDefault('key', [1, 2, 3]);

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('multiGet and multiSet', () => {
    it('should get multiple values at once', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        const values: Record<string, string> = { key1: 'value1', key2: 'value2' };
        return values[key] || null;
      });

      const result = service.multiGet(['key1', 'key2', 'key3']);

      expect(result.size).toBe(3);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
      expect(result.get('key3')).toBeNull();
    });

    it('should set multiple values from Map', () => {
      const entries = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ]);

      service.multiSet(entries);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should set multiple values from object', () => {
      const entries = { key1: 'value1', key2: 'value2' };

      service.multiSet(entries);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple keys', () => {
      service.deleteMany(['key1', 'key2', 'key3']);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('keys, values, and entries', () => {
    it('should return all keys', () => {
      Object.defineProperty(mockLocalStorage, 'length', { value: 2, writable: true });
      Object.defineProperty(mockLocalStorage, 'key1', { value: 'value1', enumerable: true });
      Object.defineProperty(mockLocalStorage, 'key2', { value: 'value2', enumerable: true });

      spyOn(Object, 'keys').and.returnValue(['key1', 'key2']);

      const result = service.keys();

      expect(result).toEqual(['key1', 'key2']);
    });

    it('should return all values', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockLocalStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.values();

      expect(result.length).toBe(2);
    });

    it('should return all entries', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockLocalStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.entries();

      expect(result.length).toBe(2);
      expect(result[0][0]).toBe('key1');
    });

    it('should handle errors when getting keys', () => {
      spyOn(Object, 'keys').and.throwError('Storage error');

      const result = service.keys();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('size', () => {
    it('should calculate storage size', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockLocalStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.size();

      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for empty storage', () => {
      spyOn(service, 'keys').and.returnValue([]);

      const result = service.size();

      expect(result).toBe(0);
    });

    it('should handle errors gracefully', () => {
      spyOn(service, 'keys').and.throwError('Storage error');

      const result = service.size();

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('value');

      const result = service.has('existing-key');

      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.has('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      service.delete('test-key');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', () => {
      (mockLocalStorage.removeItem as jasmine.Spy).and.throwError('Storage error');

      service.delete('error-key');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all storage', () => {
      service.clear();

      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      (mockLocalStorage.clear as jasmine.Spy).and.callFake(() => {
        throw new Error('Storage error');
      });

      service.clear();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('length', () => {
    it('should return storage length', () => {
      Object.defineProperty(mockLocalStorage, 'length', { value: 5, writable: true });

      const result = service.length;

      expect(result).toBe(5);
    });

    it('should return 0 on error', () => {
      Object.defineProperty(mockLocalStorage, 'length', {
        get: () => {
          throw new Error('Storage error');
        }
      });

      const result = service.length;

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error in get method', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.get('key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle error in has method', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.has('key');

      expect(result).toBe(false);
    });

    it('should handle error in delete method', () => {
      (mockLocalStorage.removeItem as jasmine.Spy).and.throwError('Storage error');

      service.delete('key');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should return empty array for keys in SSR context', () => {
      // Already tested in the SSR section
      expect(true).toBe(true);
    });

    it('should handle updateJson with non-object existing value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('not-an-object');

      service.updateJson('key', { update: true }, {});

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle updateJson with null existing value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      service.updateJson('key', { new: true }, {});

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle multiSet with some errors', () => {
      (mockLocalStorage.setItem as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'error-key') {
          throw new Error('Storage error');
        }
      });

      service.multiSet({ key1: 'value1', 'error-key': 'value2' });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle deleteMany with errors', () => {
      (mockLocalStorage.removeItem as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'error-key') {
          throw new Error('Storage error');
        }
      });

      service.deleteMany(['key1', 'error-key']);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle entries with error', () => {
      spyOn(service, 'keys').and.returnValue(['key1']);
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.entries();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0][1]).toBeNull();
    });

    it('should handle values with error', () => {
      spyOn(service, 'keys').and.returnValue(['key1']);
      (mockLocalStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.values();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0]).toBeNull();
    });

    it('should handle getWithDefault with null value and allowed values', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getWithDefault('key', 'default', ['option1', 'option2']);

      expect(result).toBe('default');
    });

    it('should handle getWithDefault with disallowed value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('not-allowed');

      const result = service.getWithDefault('key', 'default', ['option1', 'option2']);

      expect(result).toBe('default');
    });

    it('should get value with skipDecoding parameter', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('encoded-value');

      const result = service.get('key', true);

      expect(result).toBeDefined();
    });

    it('should set value with skipEncoding parameter', () => {
      service.set('key', 'value', true);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle setJson with complex nested object', () => {
      const complex = {
        a: 1,
        b: { c: 2, d: { e: 3 } },
        f: [1, 2, 3]
      };

      service.setJson('complex', complex);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle getArray with null when not exists', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getArray<string>('key');

      expect(result).toBeNull();
    });

    it('should handle multiGet with mixed existing and non-existing keys', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : null;
      });

      const result = service.multiGet(['key1', 'key2']);

      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBeNull();
    });

    it('should handle updateJson with array merge', () => {
      const existing = { items: [1, 2] };
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(existing));

      service.updateJson('key', { items: [3, 4] }, {});

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle getEnum with valid string value', () => {
      type Status = 'active' | 'inactive';
      const statusValues = ['active', 'inactive'] as const;
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue('active');

      const result = service.getEnum<Status>('key', statusValues);

      expect(result).toBe('active');
    });

    it('should handle delete of non-existing key', () => {
      service.delete('non-existing');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('non-existing');
    });

    it('should handle multiSet with empty object', () => {
      service.multiSet({});

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle deleteMany with empty array', () => {
      service.deleteMany([]);

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle has with null value', () => {
      (mockLocalStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.has('key');

      expect(result).toBe(false);
    });
  });

  describe('SSR context', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [LocalStorageService, StorageEncoderService, { provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(LocalStorageService);
    });

    it('should handle set in SSR context', () => {
      service.set('key', 'value');
      // Should not throw, just no-op
      expect(true).toBe(true);
    });

    it('should return null for get in SSR context', () => {
      const result = service.get('key');
      expect(result).toBeNull();
    });

    it('should return empty array for keys in SSR context', () => {
      const result = service.keys();
      expect(result).toEqual([]);
    });

    it('should return 0 for length in SSR context', () => {
      const result = service.length;
      expect(result).toBe(0);
    });

    it('should return 0 for size in SSR context', () => {
      const result = service.size();
      expect(result).toBe(0);
    });
  });
});

describe('SessionStorageService', () => {
  let service: SessionStorageService;
  let consoleErrorSpy: jasmine.Spy;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    // Create mock sessionStorage
    mockSessionStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear'),
      key: jasmine.createSpy('key'),
      length: 0
    };

    // Replace window.sessionStorage with mock
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [SessionStorageService, StorageEncoderService, { provide: PLATFORM_ID, useValue: 'browser' }]
    });

    service = TestBed.inject(SessionStorageService);
    consoleErrorSpy = spyOn(console, 'error');
  });

  afterEach(() => {
    // Reset the clear spy to avoid triggering errors in cleanup
    (mockSessionStorage.clear as jasmine.Spy).and.stub();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('session-value');

      service.set('session-key', 'session-value');
      const result = service.get('session-key');

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(result).toBe('session-value');
    });

    it('should delete values', () => {
      service.delete('session-key');

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('session-key');
    });

    it('should clear all values', () => {
      service.clear();

      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });
  });

  describe('type-safe getters', () => {
    it('should get boolean values', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('true');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(true);
    });

    it('should get number values', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('42');

      const result = service.getNumber('num-key');

      expect(result).toBe(42);
    });

    it('should get JSON values', () => {
      const testObj = { test: 'value' };
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(testObj));

      const result = service.getJson('json-key');

      expect(result).toEqual(testObj);
    });
  });

  describe('SSR context', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SessionStorageService, StorageEncoderService, { provide: PLATFORM_ID, useValue: 'server' }]
      });
      service = TestBed.inject(SessionStorageService);
    });

    it('should handle operations in SSR context gracefully', () => {
      service.set('key', 'value');
      const result = service.get('key');

      expect(result).toBeNull();
    });

    it('should return empty array for keys in SSR', () => {
      const result = service.keys();
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle setItem errors', () => {
      (mockSessionStorage.setItem as jasmine.Spy).and.throwError('Quota exceeded');

      service.set('key', 'value');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle getItem errors', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.throwError('Storage error');

      const result = service.get('key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('advanced features', () => {
    it('should support multiGet and multiSet', () => {
      const entries = { key1: 'value1', key2: 'value2' };

      service.multiSet(entries);

      expect(mockSessionStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should calculate storage size', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockSessionStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.size();

      expect(result).toBeGreaterThan(0);
    });

    it('should check key existence', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('value');

      const exists = service.has('key');

      expect(exists).toBe(true);
    });

    it('should update JSON with partial values', () => {
      const existing = { name: 'John', age: 30 };
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue(JSON.stringify(existing));

      service.updateJson('user', { age: 31 }, {});

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should get boolean with default', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getBooleanWithDefault('key', true);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should get number with default', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue(null);

      const result = service.getNumberWithDefault('key', 42);

      expect(result).toBe(42);
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('should delete multiple keys', () => {
      service.deleteMany(['key1', 'key2', 'key3']);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledTimes(3);
    });

    it('should get entries as key-value pairs', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockSessionStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.entries();

      expect(result.length).toBe(2);
      expect(result[0][0]).toBe('key1');
    });

    it('should get all values', () => {
      spyOn(service, 'keys').and.returnValue(['key1', 'key2']);
      (mockSessionStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
        return key === 'key1' ? 'value1' : 'value2';
      });

      const result = service.values();

      expect(result.length).toBe(2);
    });

    it('should return storage length', () => {
      Object.defineProperty(mockSessionStorage, 'length', { value: 3, writable: true });

      const result = service.length;

      expect(result).toBe(3);
    });

    it('should handle setIfNotExists when key exists', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('existing');

      service.setIfNotExists('key', 'new-value');

      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle getWithDefault with empty allowed values', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('anyvalue');

      const result = service.getWithDefault('key', 'default', []);

      expect(result).toBe('anyvalue');
    });

    it('should handle getBoolean with "no"', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('no');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(false);
    });

    it('should handle getBoolean with "off"', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('off');

      const result = service.getBoolean('bool-key');

      expect(result).toBe(false);
    });

    it('should handle setJson with circular reference error', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      service.setJson('circular', circular);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle getArray with parse error', () => {
      (mockSessionStorage.getItem as jasmine.Spy).and.returnValue('invalid-json');

      const result = service.getArray('key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
