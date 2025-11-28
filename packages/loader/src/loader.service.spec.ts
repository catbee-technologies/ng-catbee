import { TestBed } from '@angular/core/testing';
import { CatbeeLoaderService } from './loader.service';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

describe('CatbeeLoaderService', () => {
  let service: CatbeeLoaderService;
  let consoleLogSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CatbeeLoaderService]
    });

    service = TestBed.inject(CatbeeLoaderService);
    consoleLogSpy = spyOn(console, 'log');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should show loader with default name', async () => {
      await service.show(null);

      expect(service.isVisible('default')).toBe(true);
    });

    it('should show loader with custom name', async () => {
      await service.show('custom-loader');

      expect(service.isVisible('custom-loader')).toBe(true);
    });

    it('should show loader with options', async () => {
      const options = {
        animation: 'ball-spin-fade' as const,
        size: 'large' as const,
        backgroundColor: 'rgba(0,0,0,0.9)',
        loaderColor: '#ff0000',
        message: 'Loading...'
      };

      await service.show('test-loader', options);

      const state = service.getState('test-loader');
      expect(state?.animation).toBe('ball-spin-fade');
      expect(state?.size).toBe('large');
      expect(state?.backgroundColor).toBe('rgba(0,0,0,0.9)');
      expect(state?.loaderColor).toBe('#ff0000');
      expect(state?.message).toBe('Loading...');
    });

    it('should show multiple loaders simultaneously', async () => {
      await service.show('loader1');
      await service.show('loader2');
      await service.show('loader3');

      expect(service.isVisible('loader1')).toBe(true);
      expect(service.isVisible('loader2')).toBe(true);
      expect(service.isVisible('loader3')).toBe(true);
    });

    it('should emit state change when showing loader', async () => {
      const statePromise = firstValueFrom(service.watch('test-loader'));

      await service.show('test-loader', { message: 'Test' });

      const state = await statePromise;
      expect(state.visible).toBe(true);
      expect(state.name).toBe('test-loader');
      expect(state.message).toBe('Test');
    });

    it('should show loader with fullscreen option', async () => {
      await service.show('fullscreen-loader', { fullscreen: true });

      const state = service.getState('fullscreen-loader');
      expect(state?.fullscreen).toBe(true);
    });

    it('should show loader with custom z-index', async () => {
      await service.show('zindex-loader', { zIndex: 10000 });

      const state = service.getState('zindex-loader');
      expect(state?.zIndex).toBe(10000);
    });

    it('should show loader with custom template', async () => {
      const template = '<div>Custom loader</div>';
      await service.show('custom-template-loader', { customTemplate: template });

      const state = service.getState('custom-template-loader');
      expect(state?.customTemplate).toBe(template);
    });

    it('should update existing loader when shown again', async () => {
      await service.show('update-loader', { message: 'First' });
      await service.show('update-loader', { message: 'Second' });

      const state = service.getState('update-loader');
      expect(state?.message).toBe('Second');
    });
  });

  describe('hide', () => {
    beforeEach(async () => {
      await service.show('test-loader');
    });

    it('should hide loader by name', async () => {
      await service.hide('test-loader');

      expect(service.isVisible('test-loader')).toBe(false);
    });

    it('should hide default loader with null name', async () => {
      await service.show(null);
      await service.hide(null);

      expect(service.isVisible('default')).toBe(false);
    });

    it('should hide loader with delay', async () => {
      const startTime = Date.now();

      await service.hide('test-loader', 100);

      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(service.isVisible('test-loader')).toBe(false);
    });

    it('should emit state change when hiding loader', async () => {
      const statePromise = firstValueFrom(service.watch('test-loader').pipe(take(1)));

      await service.hide('test-loader');

      const state = await statePromise;
      expect(state.visible).toBe(false);
    });

    it('should not throw when hiding non-existent loader', async () => {
      await expectAsync(service.hide('non-existent')).toBeResolved();
    });

    it('should remove loader from active loaders', async () => {
      expect(service.getVisibleLoaders()).toContain('test-loader');

      await service.hide('test-loader');

      expect(service.getVisibleLoaders()).not.toContain('test-loader');
    });
  });

  describe('hideAll', () => {
    beforeEach(async () => {
      await service.show('loader1');
      await service.show('loader2');
      await service.show('loader3');
    });

    it('should hide all active loaders', async () => {
      await service.hideAll();

      expect(service.isVisible('loader1')).toBe(false);
      expect(service.isVisible('loader2')).toBe(false);
      expect(service.isVisible('loader3')).toBe(false);
    });

    it('should clear all loaders from visible list', async () => {
      await service.hideAll();

      expect(service.getVisibleLoaders().length).toBe(0);
    });

    it('should work when no loaders are active', async () => {
      await service.hideAll();
      await expectAsync(service.hideAll()).toBeResolved();
    });
  });

  describe('watch', () => {
    it('should return observable for specific loader', done => {
      service.watch('observable-loader').subscribe(state => {
        expect(state.name).toBe('observable-loader');
        expect(state.visible).toBe(true);
        done();
      });

      service.show('observable-loader');
    });

    it('should only emit states for specified loader', done => {
      let emissionCount = 0;

      service.watch('specific-loader').subscribe(() => {
        emissionCount++;
      });

      service.show('specific-loader').then(() => {
        service.show('other-loader').then(() => {
          expect(emissionCount).toBe(1);
          done();
        });
      });
    });

    it('should watch loader with null name as default', done => {
      service.watch(null).subscribe(state => {
        expect(state.name).toBe('default');
        done();
      });

      service.show(null);
    });
  });

  describe('isVisible', () => {
    it('should return false for non-existent loader', () => {
      expect(service.isVisible('non-existent')).toBe(false);
    });

    it('should return true for visible loader', async () => {
      await service.show('visible-loader');

      expect(service.isVisible('visible-loader')).toBe(true);
    });

    it('should return false after hiding loader', async () => {
      await service.show('hide-test-loader');
      await service.hide('hide-test-loader');

      expect(service.isVisible('hide-test-loader')).toBe(false);
    });

    it('should handle null name as default', async () => {
      await service.show(null);

      expect(service.isVisible(null)).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return undefined for non-existent loader', () => {
      expect(service.getState('non-existent')).toBeUndefined();
    });

    it('should return state for visible loader', async () => {
      await service.show('state-loader', { message: 'Test state' });

      const state = service.getState('state-loader');

      expect(state).toBeDefined();
      expect(state?.name).toBe('state-loader');
      expect(state?.visible).toBe(true);
      expect(state?.message).toBe('Test state');
    });

    it('should return undefined after hiding loader', async () => {
      await service.show('temp-loader');
      await service.hide('temp-loader');

      expect(service.getState('temp-loader')).toBeUndefined();
    });

    it('should handle null name as default', async () => {
      await service.show(null, { message: 'Default loader' });

      const state = service.getState(null);

      expect(state?.name).toBe('default');
      expect(state?.message).toBe('Default loader');
    });
  });

  describe('getVisibleLoaders', () => {
    it('should return empty array when no loaders are visible', () => {
      expect(service.getVisibleLoaders()).toEqual([]);
    });

    it('should return array of visible loader names', async () => {
      await service.show('loader1');
      await service.show('loader2');

      const visible = service.getVisibleLoaders();

      expect(visible.length).toBe(2);
      expect(visible).toContain('loader1');
      expect(visible).toContain('loader2');
    });

    it('should update after hiding loaders', async () => {
      await service.show('loader1');
      await service.show('loader2');
      await service.hide('loader1');

      const visible = service.getVisibleLoaders();

      expect(visible.length).toBe(1);
      expect(visible).toContain('loader2');
      expect(visible).not.toContain('loader1');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined name as default', async () => {
      await service.show(undefined);

      expect(service.isVisible('default')).toBe(true);
    });

    it('should handle empty string name', async () => {
      await service.show('');

      expect(service.isVisible('')).toBe(true);
    });

    it('should handle special characters in loader name', async () => {
      const specialName = 'loader-with-special_chars$123';
      await service.show(specialName);

      expect(service.isVisible(specialName)).toBe(true);
    });

    it('should handle rapid show/hide calls', async () => {
      await service.show('rapid-loader');
      await service.hide('rapid-loader');
      await service.show('rapid-loader');
      await service.hide('rapid-loader');

      expect(service.isVisible('rapid-loader')).toBe(false);
    });

    it('should handle all display options at once', async () => {
      const options = {
        backgroundColor: 'rgba(255,0,0,0.5)',
        loaderColor: '#00ff00',
        size: 'small' as const,
        animation: 'ball-pulse' as const,
        fullscreen: false,
        zIndex: 5000,
        customTemplate: '<div>Custom</div>',
        message: 'Loading all options',
        blockScroll: false
      };

      await service.show('all-options-loader', options);

      const state = service.getState('all-options-loader');
      expect(state?.backgroundColor).toBe(options.backgroundColor);
      expect(state?.loaderColor).toBe(options.loaderColor);
      expect(state?.size).toBe(options.size);
      expect(state?.animation).toBe(options.animation);
      expect(state?.fullscreen).toBe(options.fullscreen);
      expect(state?.zIndex).toBe(options.zIndex);
      expect(state?.customTemplate).toBe(options.customTemplate);
      expect(state?.message).toBe(options.message);
    });
  });
});
