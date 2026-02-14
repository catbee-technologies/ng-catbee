import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ElementRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { distinctUntilChanged, fromEvent, map, merge, Observable, of, shareReplay, startWith } from 'rxjs';

/**
 * Service providing safe access to browser APIs and utility functions.
 *
 * This service is designed to work seamlessly in both browser and server-side rendering (SSR) environments.
 * All browser-specific APIs are safely guarded and return `null` or safe defaults when running on the server.
 *
 * @example
 * ```typescript
 * constructor(private browserService: BrowserService) {
 *   if (this.browserService.window) {
 *     // Safe to use browser APIs
 *     console.log('Window available');
 *   }
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  private readonly nativeDocument = inject<Document>(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Observable that emits `true` when the browser tab is visible and `false` when it is hidden.
   * This is useful for pausing or resuming activities based on tab visibility.
   * The observable starts with the current visibility state and emits new values whenever it changes.
   *
   * @example
   * ```typescript
   * this.browserService.tabVisibility$.subscribe(isVisible => {
   *   console.log('Tab is visible:', isVisible);
   * });
   * ```
   */
  public readonly tabVisibility$: Observable<boolean> = this.window
    ? fromEvent(this.document, 'visibilitychange').pipe(
        startWith(null),
        map(() => this.document.visibilityState === 'visible'),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true })
      )
    : of(true);

  /**
   * Observable that emits `true` when the browser is online and `false` when it is offline.
   * This is useful for handling network connectivity changes in your application.
   * The observable starts with the current online status and emits new values whenever it changes.
   *
   * @example
   * ```typescript
   * this.browserService.online$.subscribe(isOnline => {
   *  console.log('Browser is online:', isOnline);
   * });
   * ```
   */
  readonly online$: Observable<boolean> = this.window
    ? merge(fromEvent(this.window, 'online'), fromEvent(this.window, 'offline')).pipe(
        map(() => this.window!.navigator.onLine),
        startWith(this.window.navigator.onLine),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true })
      )
    : of(false);

  /**
   * Gets the global window object if running in a browser environment.
   *
   * @returns The window object in browser context, or `null` during SSR.
   *
   * @example
   * ```typescript
   * if (this.browserService.window) {
   *   const width = this.browserService.window.innerWidth;
   * }
   * ```
   */
  get window(): (Window & typeof globalThis) | null {
    return isPlatformBrowser(this.platformId) ? window : null;
  }

  /**
   * Gets the document object.
   *
   * This is safe to use in both browser and SSR contexts as Angular's DOCUMENT token
   * provides a platform-appropriate implementation.
   *
   * @returns The document object for the current platform.
   */
  get document(): Document {
    return this.nativeDocument;
  }

  /**
   * Gets the localStorage object if running in a browser environment.
   */
  get localStorage(): Storage | null {
    return this.window?.localStorage ?? null;
  }

  /**
   * Gets the sessionStorage object if running in a browser environment.
   */
  get sessionStorage(): Storage | null {
    return this.window?.sessionStorage ?? null;
  }

  /**
   * Gets the user's preferred language from the browser's navigator object.
   * Returns `null` if not running in a browser environment.
   *
   * @returns The preferred language string (e.g., 'en-US') or `null` in SSR.
   */
  get preferredLanguage(): string | null {
    return this.window?.navigator.language ?? null;
  }

  /**
   * Scrolls the window to the top of the page with an optional behavior.
   * This method is safe to call in SSR (no-op).
   *
   * @param behavior - The scroll behavior, either 'smooth' or 'auto'. Defaults to 'smooth'.
   * @param offset - An optional offset in pixels to scroll above the top. Defaults to 0.
   *
   * @example
   * ```typescript
   * this.browserService.scrollToTop('smooth', 100);
   * ```
   */
  scrollToTop(behavior: ScrollBehavior = 'smooth', offset: number = 0): void {
    this.window?.scrollTo({ top: offset, behavior });
  }

  /**
   * Scrolls the window to a specific element by its ID with an optional offset and behavior.
   * This method is safe to call in SSR (no-op).
   *
   * @param id - The ID of the element to scroll to.
   * @param offset - An optional offset in pixels to scroll above the element. Defaults to 0.
   * @param behavior - The scroll behavior, either 'smooth' or 'auto'. Defaults to 'smooth'.
   *
   * @example
   * ```typescript
   * this.browserService.scrollTo('section1', 50, 'smooth');
   * ```
   */
  scrollTo(id: string | ElementRef<HTMLElement>, offset: number = 0, behavior: ScrollBehavior = 'smooth'): void {
    if (!this.window) return;
    let element: HTMLElement | null = null;
    if (id instanceof ElementRef) {
      element = id.nativeElement;
    } else {
      element = this.document.getElementById(id);
    }
    if (!element) return;
    const elementPosition = element.getBoundingClientRect().top + this.window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    this.window.scrollTo({ top: offsetPosition, behavior });
  }

  /**
   * Copies text to the system clipboard.
   *
   * This method uses the modern Clipboard API and is safe to call in SSR (no-op).
   *
   * @param text - The text to copy to clipboard.
   * @returns A promise that resolves when the text is copied, or rejects with an error.
   *
   * @example
   * ```typescript
   * await this.browserService.copyToClipboard('Hello World');
   * ```
   */
  async copyToClipboard(text: string): Promise<void> {
    if (!this.window) {
      return Promise.reject(new Error('Clipboard API not available in SSR context'));
    }

    if (!this.window.navigator?.clipboard) {
      return Promise.reject(new Error('Clipboard API not supported'));
    }

    return this.window.navigator.clipboard.writeText(text);
  }

  /**
   * Checks if the browser has an active network connection.
   *
   * @returns `true` if online, `false` if offline or in SSR context.
   *
   * @example
   * ```typescript
   * if (this.browserService.isOnline) {
   *   // Proceed with network request
   * }
   * ```
   */
  get isOnline(): boolean {
    if (!this.window) return false;

    return this.window.navigator.onLine;
  }

  /**
   * Displays a browser notification.
   *
   * This method handles permission requests automatically. If permission is not granted,
   * it will request permission before showing the notification.
   * Safe to call in SSR (no-op).
   *
   * @param title - The title of the notification.
   * @param options - Optional configuration for the notification.
   * @returns A promise that resolves to the Notification object if shown, or undefined if not.
   *
   * @example
   * ```typescript
   * this.browserService.showNotification('New Message', {
   *   body: 'You have a new message!',
   *   icon: '/assets/icon.png'
   * });
   * ```
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<Notification | undefined> {
    if (!this.window) return undefined;

    if (!('Notification' in this.window)) {
      console.warn('Notification API not supported');
      return undefined;
    }

    try {
      if (Notification.permission === 'granted') {
        return new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          return new Notification(title, options);
        }
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }

    return undefined;
  }
}
