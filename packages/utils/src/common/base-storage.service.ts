import { inject, PLATFORM_ID } from '@angular/core';
import { fromEvent, Observable, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { StorageEncoderService } from './storage-encoder.service';

/**
 * Abstract base class for storage services (localStorage and sessionStorage).
 *
 * This class provides common encoding/decoding and type-safe storage operations
 * with SSR support. All methods gracefully handle server-side rendering.
 *
 * @internal
 */
export abstract class BaseStorageService {
  protected readonly platformId = inject(PLATFORM_ID);
  private readonly encoder = inject(StorageEncoderService);

  /**
   * Returns the storage object (localStorage or sessionStorage).
   * Must be implemented by derived classes.
   */
  protected abstract getStorage(): Storage | null;

  /**
   * Returns the storage name for error messages.
   */
  protected abstract getStorageName(): string;

  /**
   * Returns the storage type for encoding/decoding configuration.
   */
  protected abstract getStorageType(): 'localStorage' | 'sessionStorage';

  /**
   * Stores a string value in storage.
   *
   * Safe to call during SSR (no-op).
   *
   * @param key - The storage key.
   * @param value - The string value to store.
   * @param skipEncoding - If true, skip encoding (useful for backend-compatible values).
   */
  set(key: string, value: string, skipEncoding: boolean = false): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(key, this.encoder.encode(value, this.getStorageType(), skipEncoding));
    } catch (error) {
      console.error(`Failed to set ${this.getStorageName()} key "${key}":`, error);
    }
  }

  /**
   * Stores a value only if the key doesn't already exist.
   *
   * Safe to call during SSR (no-op).
   *
   * @param key - The storage key.
   * @param value - The string value to store.
   */
  setIfNotExists(key: string, value: string): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      if (!storage.getItem(key)) {
        this.set(key, value);
      }
    } catch (error) {
      console.error(`Failed to check/set ${this.getStorageName()} key "${key}":`, error);
    }
  }

  /**
   * Retrieves a string value from storage.
   *
   * @param key - The storage key.
   * @param skipDecoding - If true, skip decoding (useful for backend-compatible values).
   * @returns The stored value, or `null` if not found or in SSR context.
   */
  get(key: string, skipDecoding: boolean = false): string | null {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      const value = storage.getItem(key);
      return value
        ? this.encoder.decode(value, this.getStorageType(), skipDecoding, false, this.getStorageName())
        : null;
    } catch (error) {
      console.error(`Failed to get ${this.getStorageName()} key "${key}":`, error);
      return null;
    }
  }

  /**
   * Retrieves a value with validation against allowed values and fallback to default.
   *
   * @param key - The storage key.
   * @param defaultValue - The default value if key not found or value is invalid.
   * @param allowedValues - Array of allowed values. If empty, any value is accepted.
   * @returns The stored value if valid, otherwise the default value.
   */
  getWithDefault(key: string, defaultValue: string, allowedValues: string[] = []): string {
    const value = this.get(key);
    if (value) {
      if (allowedValues.length && !allowedValues.includes(value)) {
        this.set(key, defaultValue);
        return defaultValue;
      }
      return value;
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Retrieves a boolean value from storage.
   *
   * Recognizes common boolean string representations:
   * - Truthy: 'true', '1', 'yes', 'on'
   * - Falsy: 'false', '0', 'no', 'off'
   *
   * @param key - The storage key.
   * @param defaultValue - The default value if key not found or value is invalid.
   * @returns The parsed boolean value or the default.
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.get(key)?.toLowerCase() || '';
    if (['true', '1', 'yes', 'on'].includes(value)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(value)) {
      return false;
    }
    this.set(key, defaultValue.toString());
    return defaultValue;
  }

  /**
   * Retrieves a numeric value from storage.
   *
   * @param key - The storage key.
   * @param defaultValue - The default value if key not found or value is not a valid number.
   * @returns The parsed number or the default.
   */
  getNumber(key: string, defaultValue: number): number {
    const value = this.get(key);
    const parsed = parseFloat(value || '');
    if (Number.isNaN(parsed)) {
      this.set(key, defaultValue.toString());
      return defaultValue;
    }
    return parsed;
  }

  /**
   * Retrieves an enum value from storage with type safety.
   *
   * @template T - The enum type (must extend string).
   * @param key - The storage key.
   * @param defaultValue - The default enum value if key not found or value is invalid.
   * @param enumValues - Array of valid enum values for validation.
   * @returns The stored enum value if valid, otherwise the default.
   */
  getEnum<T extends string>(key: string, defaultValue: T, enumValues: readonly T[]): T {
    const value = this.get(key);

    if (typeof value === 'string' && enumValues.includes(value as T)) {
      return value as T;
    }

    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Retrieves and parses a JSON value from storage.
   *
   * @template T - The expected type of the parsed object.
   * @param key - The storage key.
   * @param defaultValue - The default value if key not found or JSON parsing fails.
   * @returns The parsed object or the default value.
   */
  getJson<T>(key: string, defaultValue: T): T {
    const value = this.get(key);
    try {
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse JSON for key "${key}":`, error);
      this.set(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
  }

  /**
   * Stores a JSON-serializable value in storage.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of the value to store.
   * @param key - The storage key.
   * @param value - The value to serialize and store.
   */
  setJson<T>(key: string, value: T): void {
    try {
      this.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to stringify JSON for key "${key}":`, error);
    }
  }

  /**
   * Retrieves and parses an array from storage.
   *
   * @template T - The expected type of array elements.
   * @param key - The storage key.
   * @param defaultValue - The default array if key not found or parsing fails.
   * @returns The parsed array or the default value.
   */
  getArray<T>(key: string, defaultValue: T[] = []): T[] {
    const value = this.get(key);
    try {
      const parsed = value ? JSON.parse(value) : defaultValue;
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (error) {
      console.error(`Failed to parse array for key "${key}":`, error);
      this.setJson(key, defaultValue);
      return defaultValue;
    }
  }

  /**
   * Stores an array in storage.
   *
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of array elements.
   * @param key - The storage key.
   * @param value - The array to store.
   */
  setArray<T>(key: string, value: T[]): void {
    this.setJson(key, value);
  }

  /**
   * Updates a stored JSON object with partial values.
   *
   * Merges the new values with existing ones (shallow merge).
   * Safe to call during SSR (no-op).
   *
   * @template T - The type of the stored object.
   * @param key - The storage key.
   * @param updates - Partial object with values to update.
   * @param defaultValue - Default value if key doesn't exist.
   */
  updateJson<T extends Record<string, unknown>>(key: string, updates: Partial<T>, defaultValue: T): void {
    const current = this.getJson<T>(key, defaultValue);
    this.setJson(key, { ...current, ...updates });
  }

  /**
   * Gets a value or sets it to the default if it doesn't exist (atomic operation).
   *
   * @param key - The storage key.
   * @param defaultValue - The default value to set and return if key doesn't exist.
   * @returns The existing value or the default value.
   */
  getOrSet(key: string, defaultValue: string): string {
    const value = this.get(key);
    if (value !== null) {
      return value;
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Retrieves multiple values at once.
   *
   * @param keys - Array of storage keys to retrieve.
   * @returns Map of key-value pairs. Missing keys will have null values.
   */
  multiGet(keys: string[]): Map<string, string | null> {
    const result = new Map<string, string | null>();
    for (const key of keys) {
      result.set(key, this.get(key));
    }
    return result;
  }

  /**
   * Sets multiple key-value pairs at once.
   *
   * Safe to call during SSR (no-op).
   *
   * @param entries - Map or object of key-value pairs to store.
   */
  multiSet(entries: Map<string, string> | Record<string, string>): void {
    const pairs = entries instanceof Map ? entries : Object.entries(entries);
    for (const [key, value] of pairs) {
      this.set(key, value);
    }
  }

  /**
   * Deletes multiple keys at once.
   *
   * Safe to call during SSR (no-op).
   *
   * @param keys - Array of storage keys to remove.
   */
  deleteMany(keys: string[]): void {
    for (const key of keys) {
      this.delete(key);
    }
  }

  /**
   * Gets all storage keys.
   *
   * @returns Array of all keys in storage, or empty array in SSR context.
   */
  keys(): string[] {
    const storage = this.getStorage();
    if (!storage) return [];
    try {
      return Object.keys(storage);
    } catch (error) {
      console.error(`Failed to get ${this.getStorageName()} keys:`, error);
      return [];
    }
  }

  /**
   * Gets all storage values.
   *
   * @returns Array of all values in storage, or empty array in SSR context.
   */
  values(): (string | null)[] {
    const storage = this.getStorage();
    if (!storage) return [];
    try {
      return this.keys().map(key => this.get(key));
    } catch (error) {
      console.error(`Failed to get ${this.getStorageName()} values:`, error);
      return [];
    }
  }

  /**
   * Gets all storage entries as key-value pairs.
   *
   * @returns Array of [key, value] tuples, or empty array in SSR context.
   */
  entries(): [string, string | null][] {
    const storage = this.getStorage();
    if (!storage) return [];
    try {
      return this.keys().map(key => [key, this.get(key)] as [string, string | null]);
    } catch (error) {
      console.error(`Failed to get ${this.getStorageName()} entries:`, error);
      return [];
    }
  }

  /**
   * Gets the approximate size of all stored data in bytes.
   *
   * Useful for monitoring storage quota usage.
   *
   * @returns Total size in bytes, or 0 in SSR context.
   */
  size(): number {
    const storage = this.getStorage();
    if (!storage) return 0;
    try {
      let total = 0;
      for (const key of this.keys()) {
        const value = storage.getItem(key);
        if (value) {
          // Calculate size: key + value (each character is roughly 2 bytes in UTF-16)
          total += (key.length + value.length) * 2;
        }
      }
      return total;
    } catch (error) {
      console.error(`Failed to calculate ${this.getStorageName()} size:`, error);
      return 0;
    }
  }

  /**
   * Watches for changes to a specific storage key across browser tabs/windows.
   *
   * Returns an Observable that emits whenever the storage value changes.
   * Note: StorageEvent only fires for changes from OTHER tabs/windows, not the current one.
   * The Observable starts with the current value.
   *
   * Safe to use during SSR (returns Observable of null).
   *
   * @param key - The storage key to watch.
   * @returns Observable that emits the current value initially, then new values on changes.
   *
   * @example
   * ```typescript
   * this.localStorage.watch('theme').subscribe(theme => {
   *   console.log('Theme changed to:', theme);
   * });
   * ```
   */
  watch(key: string): Observable<string | null> {
    // SSR: return observable of null
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    // Get storage type for filtering events
    const storageType = this.getStorageName();

    // Start with current value, then emit on storage events
    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter(event => {
        // Filter for matching key and storage type
        const isMatchingStorage =
          (storageType === 'localStorage' && event.storageArea === window.localStorage) ||
          (storageType === 'sessionStorage' && event.storageArea === window.sessionStorage);

        return event.key === key && isMatchingStorage;
      }),
      map(event =>
        event.newValue
          ? this.encoder.decode(event.newValue, this.getStorageType(), false, false, this.getStorageName())
          : null
      ),
      startWith(this.get(key))
    );
  }

  /**
   * Watches all storage changes across browser tabs/windows.
   *
   * Returns an Observable that emits storage events for any key changes.
   * Note: StorageEvent only fires for changes from OTHER tabs/windows, not the current one.
   *
   * Safe to use during SSR (returns empty Observable).
   *
   * @returns Observable that emits storage change events.
   *
   * @example
   * ```typescript
   * this.localStorage.watchAll().subscribe(change => {
   *   console.log(`Key "${change.key}" changed from "${change.oldValue}" to "${change.newValue}"`);
   * });
   * ```
   */
  watchAll(): Observable<{ key: string | null; oldValue: string | null; newValue: string | null }> {
    // SSR: return empty observable
    if (!isPlatformBrowser(this.platformId)) {
      return of();
    }

    const storageType = this.getStorageName();

    return fromEvent<StorageEvent>(window, 'storage').pipe(
      filter(event => {
        // Filter for matching storage type
        return (
          (storageType === 'localStorage' && event.storageArea === window.localStorage) ||
          (storageType === 'sessionStorage' && event.storageArea === window.sessionStorage)
        );
      }),
      map(event => ({
        key: event.key,
        oldValue: event.oldValue
          ? this.encoder.decode(event.oldValue, this.getStorageType(), false, false, this.getStorageName())
          : null,
        newValue: event.newValue
          ? this.encoder.decode(event.newValue, this.getStorageType(), false, false, this.getStorageName())
          : null
      }))
    );
  }

  /**
   * Checks if a key exists in storage.
   *
   * @param key - The storage key to check.
   * @returns `true` if the key exists, `false` otherwise or in SSR context.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Removes a key from storage.
   *
   * Safe to call during SSR (no-op).
   *
   * @param key - The storage key to remove.
   */
  delete(key: string): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to delete ${this.getStorageName()} key "${key}":`, error);
    }
  }

  /**
   * Clears all data from storage.
   *
   * Safe to call during SSR (no-op).
   */
  clear(): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.clear();
    } catch (error) {
      console.error(`Failed to clear ${this.getStorageName()}:`, error);
    }
  }

  /**
   * Gets the number of items in storage.
   *
   * @returns The number of items, or 0 in SSR context.
   */
  get length(): number {
    const storage = this.getStorage();
    if (!storage) return 0;
    try {
      return storage.length;
    } catch (error) {
      console.error(`Failed to get ${this.getStorageName()} length:`, error);
      return 0;
    }
  }
}
