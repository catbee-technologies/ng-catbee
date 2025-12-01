import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CatbeeLoader } from './loader.component';
import { CatbeeLoaderService } from './loader.service';
import { CatbeeLoaderAnimation, CatbeeLoaderSize } from './loader.types';

describe('CatbeeLoader', () => {
  let component: CatbeeLoader;
  let fixture: ComponentFixture<CatbeeLoader>;
  let service: CatbeeLoaderService;
  let isFixtureDestroyed = false;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatbeeLoader],
      providers: [CatbeeLoaderService, { provide: PLATFORM_ID, useValue: 'browser' }]
    }).compileComponents();

    fixture = TestBed.createComponent(CatbeeLoader);
    component = fixture.componentInstance;
    service = TestBed.inject(CatbeeLoaderService);
    spyOn(console, 'log');
    spyOn(console, 'error');
    spyOn(console, 'warn');
    isFixtureDestroyed = false;
    fixture.detectChanges();
  });

  afterEach(async () => {
    await service.hideAll();
    if (!isFixtureDestroyed) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.name()).toBe('default');
      expect(component.loaderData().fullscreen).toBe(true);
    });

    it('should not render initially', () => {
      expect(component.shouldRender()).toBe(false);
    });

    it('should subscribe to loader service on init', () => {
      spyOn(service, 'watch').and.callThrough();

      component.ngOnInit();

      expect(service.watch).toHaveBeenCalledWith('default');
    });
  });

  describe('showing loader', () => {
    it('should render when service shows loader', async () => {
      await service.show('default');
      fixture.detectChanges();

      expect(component.shouldRender()).toBe(true);
      expect(component.loaderData().visible).toBe(true);
    });

    it('should display with custom animation', async () => {
      fixture.componentRef.setInput('animation', 'ball-spin-fade');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().animation).toBe('ball-spin-fade');
    });

    it('should display with custom size', async () => {
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().size).toBe('large');
    });

    it('should display custom message', async () => {
      fixture.componentRef.setInput('message', 'Loading data...');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().message).toBe('Loading data...');
    });

    it('should apply custom background color', async () => {
      fixture.componentRef.setInput('backgroundColor', 'rgba(255,0,0,0.5)');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().backgroundColor).toBe('rgba(255,0,0,0.5)');
    });

    it('should apply custom loader color', async () => {
      fixture.componentRef.setInput('loaderColor', '#ff0000');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().loaderColor).toBe('#ff0000');
    });

    it('should apply custom z-index', async () => {
      fixture.componentRef.setInput('zIndex', 10000);
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().zIndex).toBe(10000);
    });

    it('should display custom template', async () => {
      const template = '<div class="custom">Custom loader</div>';
      fixture.componentRef.setInput('customTemplate', template);
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().customTemplate).toBe(template);
    });

    it('should set fullscreen mode', async () => {
      fixture.componentRef.setInput('fullscreen', false);
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().fullscreen).toBe(false);
    });

    it('should generate correct element count based on animation', async () => {
      fixture.componentRef.setInput('animation', 'ball-spin');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().elementCount).toBe(8); // ball-spin has 8 elements
    });

    it('should generate correct CSS class', async () => {
      fixture.componentRef.setInput('animation', 'ball-pulse');
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().cssClass).toContain('la-ball-pulse');
      expect(component.loaderData().cssClass).toContain('la-3x');
    });
  });

  describe('hiding loader', () => {
    beforeEach(async () => {
      await service.show('default');
      fixture.detectChanges();
    });

    it('should set fading out state when hiding', async () => {
      await service.hide('default');
      fixture.detectChanges();

      expect(component.isFadingOut()).toBe(true);
    });

    it('should remove render after fade out animation', done => {
      service.hide('default').then(() => {
        fixture.detectChanges();

        setTimeout(() => {
          fixture.detectChanges();
          expect(component.shouldRender()).toBe(false);
          expect(component.isFadingOut()).toBe(false);
          isFixtureDestroyed = true;
          fixture.destroy();
          done();
        }, 250);
      });
    });

    it('should set visible to false', async () => {
      await service.hide('default');
      fixture.detectChanges();

      expect(component.loaderData().visible).toBe(false);
    });
  });

  describe('service overrides', () => {
    it('should prioritize service options over component inputs', async () => {
      fixture.componentRef.setInput('animation', 'ball-pulse');
      fixture.componentRef.setInput('message', 'Component message');
      fixture.detectChanges();

      await service.show('default', {
        animation: 'ball-spin-fade',
        message: 'Service message'
      });
      fixture.detectChanges();

      expect(component.loaderData().animation).toBe('ball-spin-fade');
      expect(component.loaderData().message).toBe('Service message');
    });

    it('should handle all service override options', async () => {
      const options = {
        backgroundColor: 'rgba(0,255,0,0.8)',
        loaderColor: '#0000ff',
        size: 'small' as CatbeeLoaderSize,
        animation: 'ball-beat' as CatbeeLoaderAnimation,
        fullscreen: false,
        zIndex: 5000,
        customTemplate: '<div>Override</div>',
        message: 'Override message'
      };

      await service.show('default', options);
      fixture.detectChanges();

      const data = component.loaderData();
      expect(data.backgroundColor).toBe(options.backgroundColor);
      expect(data.loaderColor).toBe(options.loaderColor);
      expect(data.size).toBe(options.size);
      expect(data.animation).toBe(options.animation);
      expect(data.fullscreen).toBe(options.fullscreen);
      expect(data.zIndex).toBe(options.zIndex);
      expect(data.customTemplate).toBe(options.customTemplate);
      expect(data.message).toBe(options.message);
    });
  });

  describe('edge cases', () => {
    it('should handle empty size value', async () => {
      fixture.componentRef.setInput('size', '');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().size).toBe('');
    });

    it('should handle custom width and height', async () => {
      fixture.componentRef.setInput('width', '100');
      fixture.componentRef.setInput('height', '100');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.width()).toBe('100');
      expect(component.height()).toBe('100');
    });

    it('should not break when service emits state for different loader', async () => {
      await service.show('other-loader');
      fixture.detectChanges();

      expect(component.shouldRender()).toBe(false);
      expect(component.loaderData().visible).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should render loader elements', async () => {
      await service.show('default');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loaderDiv = compiled.querySelector('.catbee-loader');

      expect(loaderDiv).toBeTruthy();
    });

    it('should apply fullscreen class when fullscreen is true', async () => {
      fixture.componentRef.setInput('fullscreen', true);
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loaderDiv = compiled.querySelector('.catbee-loader');

      expect(loaderDiv?.classList.contains('fullscreen')).toBe(true);
    });

    it('should apply fading-out class when hiding', async () => {
      await service.show('default');
      fixture.detectChanges();

      await service.hide('default');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loaderDiv = compiled.querySelector('.catbee-loader');

      expect(loaderDiv?.classList.contains('fading-out')).toBe(true);
    });

    it('should render message when provided', async () => {
      fixture.componentRef.setInput('message', 'Test message');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const messageDiv = compiled.querySelector('.ng-catbee-loader-message');

      expect(messageDiv?.textContent).toContain('Test message');
    });

    it('should render custom template when provided', async () => {
      fixture.componentRef.setInput('customTemplate', '<div class="custom-test">Custom</div>');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const customDiv = compiled.querySelector('.custom-test');

      expect(customDiv).toBeTruthy();
      expect(customDiv?.textContent).toContain('Custom');
    });

    it('should not render when shouldRender is false', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const loaderDiv = compiled.querySelector('.catbee-loader');

      expect(loaderDiv).toBeFalsy();
    });
  });

  describe('CSS class generation', () => {
    it('should generate correct class for small size', async () => {
      fixture.componentRef.setInput('size', 'small');
      fixture.componentRef.setInput('animation', 'ball-pulse');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().cssClass).toContain('la-sm');
    });

    it('should generate correct class for medium size', async () => {
      fixture.componentRef.setInput('size', 'medium');
      fixture.componentRef.setInput('animation', 'ball-pulse');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().cssClass).toContain('la-2x');
    });

    it('should generate correct class for large size', async () => {
      fixture.componentRef.setInput('size', 'large');
      fixture.componentRef.setInput('animation', 'ball-pulse');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().cssClass).toContain('la-3x');
    });

    it('should include animation class', async () => {
      fixture.componentRef.setInput('animation', 'ball-spin-clockwise');
      fixture.detectChanges();

      await service.show('default');
      fixture.detectChanges();

      expect(component.loaderData().cssClass).toContain('la-ball-spin-clockwise');
    });
  });
});
