import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { StorageEncoderService } from './storage-encoder.service';
import { CATBEE_STORAGE_CONFIG } from './storage.config';
import type { CatbeeStorageConfig } from './storage.types';

describe('StorageEncoderService', () => {
  let service: StorageEncoderService;
  let consoleErrorSpy: jasmine.Spy;

  describe('default configuration (browser)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [StorageEncoderService, { provide: PLATFORM_ID, useValue: 'browser' }]
      });

      service = TestBed.inject(StorageEncoderService);
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('encode - default encoding', () => {
      it('should return value as-is for default encoding', () => {
        const result = service.encode('test-value', 'localStorage', false);
        expect(result).toBe('test-value');
      });

      it('should handle values with spaces', () => {
        const result = service.encode('test value with spaces', 'localStorage', false);
        expect(result).toBe('test value with spaces');
      });

      it('should handle special characters', () => {
        const result = service.encode('test@#$%', 'sessionStorage', false);
        expect(result).toBe('test@#$%');
      });

      it('should skip encoding when skipEncoding is true', () => {
        const result = service.encode('test-value', 'localStorage', true);
        expect(result).toBe('test-value');
      });

      it('should handle empty strings', () => {
        const result = service.encode('', 'localStorage', false);
        expect(result).toBe('');
      });

      it('should handle unicode characters', () => {
        const result = service.encode('Hello 世界', 'sessionStorage', false);
        expect(result).toBe('Hello 世界');
      });
    });

    describe('decode - default encoding', () => {
      it('should return value as-is for default encoding', () => {
        const result = service.decode('test-value', 'localStorage', false);
        expect(result).toBe('test-value');
      });

      it('should handle values with spaces', () => {
        const encoded = 'test value with spaces';
        const result = service.decode(encoded, 'sessionStorage', false);
        expect(result).toBe('test value with spaces');
      });

      it('should skip decoding when skipDecoding is true', () => {
        const result = service.decode('encoded-value', 'localStorage', true);
        expect(result).toBe('encoded-value');
      });

      it('should handle empty strings', () => {
        const result = service.decode('', 'localStorage', false);
        expect(result).toBe('');
      });

      it('should handle decode errors gracefully', () => {
        const result = service.decode('invalid%', 'sessionStorage', false, 'cookie');
        // For default encoding, no error should occur
        expect(result).toBe('invalid%');
      });

      it('should include error context in error message if error occurs', () => {
        service.decode('value', 'sessionStorage', false, 'test-cookie');
        // No error for default encoding
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('base64 encoding configuration', () => {
    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        localStorage: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should encode with base64', () => {
      const result = service.encode('test-value', 'localStorage', false);
      expect(result).toBe(btoa('test-value'));
    });

    it('should encode with base64 for strings with spaces', () => {
      const result = service.encode('test value', 'localStorage', false);
      expect(result).toBe(btoa('test value'));
    });

    it('should decode from base64', () => {
      const encoded = btoa('test-value');
      const result = service.decode(encoded, 'localStorage', false);
      expect(result).toBe('test-value');
    });

    it('should decode from base64 with spaces', () => {
      const encoded = btoa('test value');
      const result = service.decode(encoded, 'localStorage', false);
      expect(result).toBe('test value');
    });

    it('should handle base64 decode errors', () => {
      const result = service.decode('invalid-base64!!!', 'localStorage', false, 'localStorage');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toBe('invalid-base64!!!');
    });
  });

  describe('custom encoding configuration', () => {
    const customEncode = (value: string) => `custom-${value}`;
    const customDecode = (value: string) => value.replace('custom-', '');

    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        localStorage: {
          encoding: 'custom',
          customEncode,
          customDecode
        }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should use custom encode function', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe('custom-test');
    });

    it('should use custom encode for strings with spaces', () => {
      const result = service.encode('test value', 'localStorage', false);
      expect(result).toBe('custom-test value');
    });

    it('should use custom decode function', () => {
      const result = service.decode('custom-test', 'localStorage', false);
      expect(result).toBe('test');
    });

    it('should use custom decode for strings with spaces', () => {
      const encoded = 'custom-test value';
      const result = service.decode(encoded, 'localStorage', false);
      expect(result).toBe('test value');
    });
  });

  describe('custom encoding with error handling', () => {
    it('should handle errors in custom decode', () => {
      // Create a custom decode that throws an error
      const errorConfig: CatbeeStorageConfig = {
        localStorage: {
          encoding: 'custom',
          customEncode: (value: string) => value,
          customDecode: (value: string) => {
            throw new Error('Custom decode error');
          }
        }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: errorConfig }
        ]
      });

      const errorService = TestBed.inject(StorageEncoderService);
      const errorSpy = spyOn(console, 'error');

      const result = errorService.decode('test', 'localStorage', false, 'localStorage');

      expect(errorSpy).toHaveBeenCalled();
      expect(result).toBe('test');
    });
  });

  describe('common configuration', () => {
    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        common: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
    });

    it('should use common encoding for localStorage', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe(btoa('test'));
    });

    it('should use common encoding for sessionStorage', () => {
      const result = service.encode('test', 'sessionStorage', false);
      expect(result).toBe(btoa('test'));
    });
  });

  describe('storage-specific overrides', () => {
    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        common: { encoding: 'base64' },
        localStorage: {
          encoding: 'custom',
          customEncode: v => `catbee-${v}`,
          customDecode: v => v.replace('catbee-', '')
        },
        sessionStorage: { encoding: 'default' }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
    });

    it('should use localStorage-specific encoding over common', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe('catbee-test');
      const decoded = service.decode('catbee-test', 'localStorage', false);
      expect(decoded).toBe('test');
    });

    it('should use sessionStorage-specific encoding over common', () => {
      const result = service.encode('test', 'sessionStorage', false);
      expect(result).toBe('test');
    });

    it('should decode sessionStorage with specific encoding', () => {
      const encoded = 'test';
      const result = service.decode(encoded, 'sessionStorage', false);
      expect(result).toBe('test');
    });
  });

  describe('SSR context', () => {
    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        localStorage: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
    });

    it('should not use btoa in SSR context for base64 encoding', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe('test');
    });

    it('should return value as-is in SSR context', () => {
      const result = service.encode('test value', 'localStorage', false);
      expect(result).toBe('test value');
    });

    it('should not use atob in SSR context for base64 decoding', () => {
      const result = service.decode('test', 'localStorage', false);
      expect(result).toBe('test');
    });

    it('should return value as-is for decode in SSR context', () => {
      const encoded = 'test value';
      const result = service.decode(encoded, 'localStorage', false);
      expect(result).toBe('test value');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [StorageEncoderService, { provide: PLATFORM_ID, useValue: 'browser' }]
      });

      service = TestBed.inject(StorageEncoderService);
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = service.encode(longString, 'localStorage', false);
      expect(result).toBe(longString);
    });

    it('should handle special JSON characters', () => {
      const jsonString = '{"key":"value"}';
      const result = service.encode(jsonString, 'localStorage', false);
      expect(result).toBe(jsonString);
    });

    it('should handle null-like strings', () => {
      const result = service.encode('null', 'localStorage', false);
      expect(result).toBe('null');
    });

    it('should handle undefined-like strings', () => {
      const result = service.encode('undefined', 'localStorage', false);
      expect(result).toBe('undefined');
    });

    it('should handle newlines and tabs', () => {
      const result = service.encode('line1\nline2\ttab', 'localStorage', false);
      expect(result).toBe('line1\nline2\ttab');
    });
  });

  describe('custom encoding with missing functions', () => {
    beforeEach(() => {
      const config: CatbeeStorageConfig = {
        localStorage: {
          encoding: 'custom'
          // Missing customEncode and customDecode
        }
      };

      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: CATBEE_STORAGE_CONFIG, useValue: config }
        ]
      });

      service = TestBed.inject(StorageEncoderService);
    });

    it('should fall back to original value when customEncode is missing', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe('test');
    });

    it('should fall back to original value when customDecode is missing', () => {
      const result = service.decode('test', 'localStorage', false);
      expect(result).toBe('test');
    });
  });

  describe('no configuration provided', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          StorageEncoderService,
          { provide: PLATFORM_ID, useValue: 'browser' }
          // No CATBEE_STORAGE_CONFIG provided
        ]
      });

      service = TestBed.inject(StorageEncoderService);
    });

    it('should use default encoding when no config is provided', () => {
      const result = service.encode('test', 'localStorage', false);
      expect(result).toBe('test');
    });

    it('should decode with default encoding when no config is provided', () => {
      const result = service.decode('test', 'localStorage', false);
      expect(result).toBe('test');
    });
  });
});
