import { TestBed } from '@angular/core/testing';
import { provideCatbeeLoader, CATBEE_LOADER_GLOBAL_CONFIG, CatbeeLoaderGlobalConfig } from './loader.config';

describe('Loader Configuration', () => {
  describe('provideCatbeeLoader', () => {
    it('should provide config with default animation', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultAnimation: 'ball-spin-fade'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultAnimation).toBe('ball-spin-fade');
    });

    it('should provide config with default size', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultSize: 'large'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultSize).toBe('large');
    });

    it('should provide config with default overlay color', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultOverlayColor: 'rgba(0, 0, 0, 0.9)'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultOverlayColor).toBe('rgba(0, 0, 0, 0.9)');
    });

    it('should provide config with default loader color', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultLoaderColor: '#ff0000'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultLoaderColor).toBe('#ff0000');
    });

    it('should provide config with default z-index', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultZIndex: 10000
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultZIndex).toBe(10000);
    });

    it('should provide config with default block scroll', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultBlockScroll: false
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultBlockScroll).toBe(false);
    });

    it('should provide config with all properties', () => {
      const config: CatbeeLoaderGlobalConfig = {
        defaultAnimation: 'ball-grid-pulse',
        defaultSize: 'medium',
        defaultOverlayColor: 'rgba(50, 50, 50, 0.8)',
        defaultLoaderColor: '#00ff00',
        defaultZIndex: 8888,
        defaultBlockScroll: true
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
        defaultAnimation: 'ball-pulse',
        defaultSize: 'small'
      };

      TestBed.configureTestingModule({
        providers: [provideCatbeeLoader(config)]
      });

      const injectedConfig = TestBed.inject(CATBEE_LOADER_GLOBAL_CONFIG);
      expect(injectedConfig.defaultAnimation).toBe('ball-pulse');
      expect(injectedConfig.defaultSize).toBe('small');
      expect(injectedConfig.defaultOverlayColor).toBeUndefined();
      expect(injectedConfig.defaultLoaderColor).toBeUndefined();
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
