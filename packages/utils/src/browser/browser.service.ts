import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

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
    if (isPlatformBrowser(this.platformId)) {
      return window;
    }
    return null;
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
   * Safely parses a JSON string without throwing errors.
   *
   * @template T - The expected type of the parsed JSON.
   * @param json - The JSON string to parse.
   * @returns The parsed object of type T, or `null` if parsing fails.
   *
   * @example
   * ```typescript
   * const data = this.browserService.safeJsonParse<{name: string}>('{"name":"John"}');
   * if (data) {
   *   console.log(data.name);
   * }
   * ```
   */
  safeJsonParse<T = unknown>(json: string): T | null {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /**
   * Initializes listeners for network status changes.
   *
   * This method is safe to call in SSR (no-op). The callback will be invoked whenever
   * the browser goes online or offline.
   *
   * @param callback - Function to call when network status changes, receiving the online status.
   * @returns A cleanup function to remove the event listeners, or undefined in SSR.
   *
   * @example
   * ```typescript
   * const cleanup = this.browserService.initializeNetworkStatusListener((isOnline) => {
   *   console.log('Network status:', isOnline ? 'online' : 'offline');
   * });
   *
   * // Later, cleanup listeners
   * cleanup?.();
   * ```
   */
  initializeNetworkStatusListener(callback: (isOnline: boolean) => void): (() => void) | undefined {
    if (!this.window) return undefined;

    const windowRef = this.window;
    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    windowRef.addEventListener('online', onlineHandler);
    windowRef.addEventListener('offline', offlineHandler);

    // Return cleanup function
    return () => {
      windowRef.removeEventListener('online', onlineHandler);
      windowRef.removeEventListener('offline', offlineHandler);
    };
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
