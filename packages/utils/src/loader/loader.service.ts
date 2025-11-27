import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoaderState, LoaderDisplayOptions, LOADER_DEFAULTS } from './loader.types';
import { Nullable } from '@ng-catbee/utils/types';

/**
 * Service for managing loading loaders across the application.
 *
 * This service provides a centralized way to show/hide loading indicators
 * with support for multiple concurrent loaders identified by unique names.
 *
 * @example
 * ```typescript
 * class DataComponent {
 *   private loader = inject(LoaderService);
 *
 *   async loadData(): Promise<void> {
 *     this.loader.display('data-loader', {
 *       animation: 'circle-spin-fade',
 *       message: 'Loading data...'
 *     });
 *
 *     try {
 *       await this.dataService.fetch();
 *     } finally {
 *       this.loader.dismiss('data-loader');
 *     }
 *   }
 * }
 * ```
 *
 * @public
 */
@Injectable({ providedIn: 'root' })
export class CatbeeLoaderService {
  private readonly stateSubject = new Subject<LoaderState>();
  private readonly activeLoaders = signal<Map<string, LoaderState>>(new Map());

  /**
   * Shows a loading loader.
   *
   * @param name - Unique name for the loader (default: 'default')
   * @param options - Display options for customizing the loader appearance
   * @returns Promise that resolves when the loader is shown
   */
  async show(name: Nullable<string>, options?: LoaderDisplayOptions): Promise<void> {
    const loaderName = name ?? LOADER_DEFAULTS.NAME;
    return new Promise(resolve => {
      console.log('Showing loader:', loaderName, options);
      const state: LoaderState = {
        name: loaderName,
        visible: true,
        backgroundColor: options?.backgroundColor,
        loaderColor: options?.loaderColor,
        size: options?.size,
        animation: options?.animation,
        fullscreen: options?.fullscreen,
        zIndex: options?.zIndex,
        customTemplate: options?.customTemplate,
        message: options?.message,
        blockScroll: options?.blockScroll
      };

      this.stateSubject.next(state);

      this.activeLoaders.update(loaders => {
        const updated = new Map(loaders);
        updated.set(loaderName, state);
        return updated;
      });

      resolve();
    });
  }

  /**
   * Hides a loader.
   *
   * @param name - Name of the loader to hide (default: 'default')
   * @param delay - Optional delay in milliseconds before hiding (default: 0)
   * @returns Promise that resolves when the loader is hidden
   */
  async hide(name: Nullable<string>, delay: number = 0): Promise<void> {
    const loaderName = name ?? LOADER_DEFAULTS.NAME;
    return new Promise(resolve => {
      const execute = () => {
        const state: LoaderState = { name: loaderName, visible: false };
        this.stateSubject.next(state);
        this.activeLoaders.update(loaders => {
          const updated = new Map(loaders);
          updated.delete(loaderName);
          return updated;
        });

        resolve();
      };

      if (delay > 0) {
        setTimeout(execute, delay);
      } else {
        execute();
      }
    });
  }

  /**
   * Dismisses all active loaders.
   *
   * @returns Promise that resolves when all loaders are hidden
   */
  async hideAll(): Promise<void> {
    const names = Array.from(this.activeLoaders().keys());
    await Promise.all(names.map(name => this.hide(name)));
  }

  /**
   * Gets an observable stream of state changes for a specific loader.
   *
   * @param name - Name of the loader to observe
   * @returns Observable of loader state changes
   */
  observe(name: Nullable<string>): Observable<LoaderState> {
    const loaderName = name ?? LOADER_DEFAULTS.NAME;
    return this.stateSubject.asObservable().pipe(filter(state => state.name === loaderName));
  }

  /**
   * Checks if a specific loader is currently visible.
   *
   * @param name - Name of the loader to check
   * @returns True if the loader is visible, false otherwise
   */
  isVisible(name: Nullable<string>): boolean {
    return this.activeLoaders().has(name ?? LOADER_DEFAULTS.NAME);
  }

  /**
   * Gets the current state of a specific loader.
   *
   * @param name - Name of the loader
   * @returns Current loader state or undefined if not found
   */
  getState(name: Nullable<string>): LoaderState | undefined {
    return this.activeLoaders().get(name ?? LOADER_DEFAULTS.NAME);
  }

  /**
   * Gets a list of currently visible loaders.
   * @returns Array of names of visible loaders
   */
  getVisibleLoaders() {
    return Array.from(this.activeLoaders().keys());
  }
}
