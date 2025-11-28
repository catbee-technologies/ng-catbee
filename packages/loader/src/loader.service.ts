import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CatbeeLoaderState, CATBEE_LOADER_DEFAULTS, CatbeeLoaderGlobalConfig } from './loader.types';

type Nullable<T> = T | null | undefined;

/**
 * Service for managing loading loaders across the application.
 *
 * This service provides a centralized way to show/hide loading indicators
 * with support for multiple concurrent loaders identified by unique names.
 *
 * @example
 * ```typescript
 *  import { Component, inject } from '@angular/core';
 *  import { LoaderService } from '@catbee/loader';
 *
 * @Component({
 *   template: `
 *     <ng-catbee-loader
 *       name="page-loader"
 *       animation="circle-spin-fade"
 *       size="lg"
 *       [fullscreen]="true"
 *     />
 *  `
 * })
 * class DataComponent {
 *   private loader = inject(LoaderService);
 *
 *   async loadData(): Promise<void> {
 *     this.loader.show('data-loader', {
 *       animation: 'circle-spin-fade',
 *       message: 'Loading data...'
 *     });
 *
 *     try {
 *       await this.dataService.fetch();
 *     } finally {
 *       this.loader.hide('data-loader');
 *     }
 *   }
 * }
 * ```
 *
 * @public
 */
@Injectable({ providedIn: 'root' })
export class CatbeeLoaderService {
  private readonly loaderState$ = new Subject<CatbeeLoaderState>();
  private readonly activeLoaders = signal<Map<string, CatbeeLoaderState>>(new Map());

  /**
   * Shows a loading loader.
   *
   * @param name - Unique name for the loader (default: 'default')
   * @param options - Loader options for customizing the loader appearance
   * @returns Promise that resolves when the loader is shown
   */
  async show(name: Nullable<string>, options?: CatbeeLoaderGlobalConfig): Promise<void> {
    const loaderName = this.getLoaderName(name);
    return new Promise(resolve => {
      const state: CatbeeLoaderState = {
        name: loaderName,
        visible: true,
        backgroundColor: options?.backgroundColor,
        loaderColor: options?.loaderColor,
        size: options?.size,
        animation: options?.animation,
        fullscreen: options?.fullscreen,
        zIndex: options?.zIndex,
        customTemplate: options?.customTemplate,
        message: options?.message
      };

      this.loaderState$.next(state);

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
    return new Promise(resolve => {
      const loaderName = this.getLoaderName(name);
      const execute = () => {
        const state: CatbeeLoaderState = { name: loaderName, visible: false };
        this.loaderState$.next(state);
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
   * Hides all active loaders.
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
   * @param name - Name of the loader to watch (default: 'default')
   * @returns Observable of loader state changes
   */
  watch(name: Nullable<string>): Observable<CatbeeLoaderState> {
    const loaderName = this.getLoaderName(name);
    return this.loaderState$.asObservable().pipe(filter(state => state.name === loaderName));
  }

  /**
   * Checks if a specific loader is currently visible.
   *
   * @param name - Name of the loader to check (default: 'default')
   * @returns True if the loader is visible, false otherwise
   */
  isVisible(name: Nullable<string>): boolean {
    return this.activeLoaders().has(this.getLoaderName(name));
  }

  /**
   * Gets the current state of a specific loader.
   *
   * @param name - Name of the loader to get state for (default: 'default')
   * @returns Current loader state or undefined if not found
   */
  getState(name: Nullable<string>): CatbeeLoaderState | undefined {
    return this.activeLoaders().get(this.getLoaderName(name));
  }

  /**
   * Gets a list of currently visible loaders.
   * @returns Array of names of visible loaders
   */
  getVisibleLoaders() {
    return Array.from(this.activeLoaders().keys());
  }

  private getLoaderName(name: Nullable<string>): string {
    return name ?? CATBEE_LOADER_DEFAULTS.name;
  }
}
