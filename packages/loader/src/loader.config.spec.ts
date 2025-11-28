import { TestBed } from '@angular/core/testing';
import { provideCatbeeLoader, CATBEE_LOADER_GLOBAL_CONFIG } from './loader.config';
import { CatbeeLoaderGlobalConfig } from './loader.types';

describe('Loader Configuration', () => {
  describe('provideCatbeeLoader', () => {
    it('should provide config with default animation', () => {
      const config: CatbeeLoaderGlobalConfig = {
        animation: 'ball-spin-fade'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.animation).toBe('ball-spin-fade');
    });

    it('should provide config with default size', () => {
      const config: CatbeeLoaderGlobalConfig = {
        size: 'large'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.size).toBe('large');
    });

    it('should provide config with default overlay color', () => {
      const config: CatbeeLoaderGlobalConfig = {
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.backgroundColor).toBe('rgba(0, 0, 0, 0.9)');
    });

    it('should provide config with default loader color', () => {
      const config: CatbeeLoaderGlobalConfig = {
        loaderColor: '#ff0000'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.loaderColor).toBe('#ff0000');
    });

    it('should provide config with default z-index', () => {
      const config: CatbeeLoaderGlobalConfig = {
        zIndex: 10000
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.zIndex).toBe(10000);
    });

    it('should provide config with all properties', () => {
      const config: CatbeeLoaderGlobalConfig = {
        animation: 'ball-spin-clockwise',
        size: 'medium',
        backgroundColor: 'rgba(50, 50, 50, 0.8)',
        loaderColor: '#00ff00',
        zIndex: 8888
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig).toEqual(config);
    });

    it('should provide empty config when no properties set', () => {
      const config: CatbeeLoaderGlobalConfig = {};

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig).toEqual({});
    });

    it('should allow partial configuration', () => {
      const config: CatbeeLoaderGlobalConfig = {
        animation: 'ball-pulse',
        size: 'small'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.animation).toBe('ball-pulse');
      expect(injectedConfig.size).toBe('small');
      expect(injectedConfig.backgroundColor).toBeUndefined();
      expect(injectedConfig.loaderColor).toBeUndefined();
    });
  });

  describe('CATBEE_LOADER_GLOBAL_CONFIG token', () => {
    it('should be defined', () => {
      expect(CATBEE_LOADER_GLOBAL_CONFIG).toBeDefined();
    });

    it('should have correct token name', () => {
      expect(CATBEE_LOADER_GLOBAL_CONFIG.toString()).toContain('CATBEE_LOADER_GLOBAL_CONFIG');
    });

    it('should be optional when not provided', () => {
      TestBed.configureTestingModule({
        providers: []
      });

      const config = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG, null, { optional: true });
      expect(config).toBeNull();
    });
  });
});
