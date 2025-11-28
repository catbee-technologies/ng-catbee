import { TestBed } from '@angular/core/testing';
import { provideCatbeeStorage, CATBEE_STORAGE_CONFIG } from './storage.config';
import type { CatbeeStorageConfig } from './storage.types';

describe('Storage Configuration', () => {
  describe('provideCatbeeStorage', () => {
    it('should provide empty config when no argument is passed', () => {
      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage()]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config).toEqual({});
    });

    it('should provide config with common encoding', () => {
      const testConfig: CatbeeStorageConfig = {
        common: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config.common?.encoding).toBe('base64');
    });

    it('should provide config with localStorage-specific encoding', () => {
      const testConfig: CatbeeStorageConfig = {
        localStorage: { encoding: 'default' }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config.localStorage?.encoding).toBe('default');
    });

    it('should provide config with sessionStorage-specific encoding', () => {
      const testConfig: CatbeeStorageConfig = {
        sessionStorage: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config.sessionStorage?.encoding).toBe('base64');
    });

    it('should provide config with all storage types', () => {
      const testConfig: CatbeeStorageConfig = {
        common: { encoding: 'default' },
        localStorage: { encoding: 'base64' },
        sessionStorage: { encoding: 'custom', customEncode: v => v, customDecode: v => v }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config.common?.encoding).toBe('default');
      expect(config.localStorage?.encoding).toBe('base64');
      expect(config.sessionStorage?.encoding).toBe('custom');
    });

    it('should provide config with custom encoding functions', () => {
      const customEncode = (value: string) => `encoded-${value}`;
      const customDecode = (value: string) => value.replace('encoded-', '');

      const testConfig: CatbeeStorageConfig = {
        localStorage: {
          encoding: 'custom',
          customEncode,
          customDecode
        }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config.localStorage?.encoding).toBe('custom');
      expect(config.localStorage?.customEncode).toBe(customEncode);
      expect(config.localStorage?.customDecode).toBe(customDecode);
    });

    it('should handle undefined config parameter', () => {
      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(undefined)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config).toEqual({});
    });

    it('should preserve all config properties', () => {
      const customEncode = (value: string) => value;
      const customDecode = (value: string) => value;

      const testConfig: CatbeeStorageConfig = {
        common: { encoding: 'default' },
        localStorage: {
          encoding: 'custom',
          customEncode,
          customDecode
        },
        sessionStorage: { encoding: 'base64' }
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeStorage(testConfig)]
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG);
      expect(config).toEqual(testConfig);
    });
  });

  describe('CATBEE_STORAGE_CONFIG token', () => {
    it('should be defined', () => {
      expect(CATBEE_STORAGE_CONFIG).toBeDefined();
    });

    it('should have correct token name', () => {
      expect(CATBEE_STORAGE_CONFIG.toString()).toContain('CATBEE_STORAGE_CONFIG');
    });

    it('should be optional when not provided', () => {
      TestBed.configureTestingModule({
        providers: []
      });

      const config = TestBed.inject(CATBEE_STORAGE_CONFIG, null, { optional: true });
      expect(config).toBeNull();
    });
  });
});
