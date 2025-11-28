import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { CATBEE_STORAGE_CONFIG } from './storage.config';
import type { CatbeeStorageEncodingConfig, StorageType } from './storage.types';

/**
 * Shared encoding/decoding service for all storage types.
 *
 * This service provides configurable encoding/decoding strategies
 * for localStorage, sessionStorage, and cookies.
 *
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class StorageEncoderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalConfig = inject(CATBEE_STORAGE_CONFIG, { optional: true });

  /**
   * Encodes a value for storage based on the configured encoding strategy.
   *
   * @param value - The value to encode.
   * @param storageType - The storage type ('localStorage', 'sessionStorage', or 'cookies').
   * @param skipEncoding - If true, bypass encoding regardless of configuration.
   * @returns The encoded value.
   */
  encode(value: string, storageType: StorageType, skipEncoding: boolean = false): string {
    if (skipEncoding) {
      return value;
    }

    const encoding = this.getEncodingForStorage(storageType);

    switch (encoding) {
      case 'base64': {
        return isPlatformBrowser(this.platformId) ? btoa(value) : value;
      }

      case 'custom': {
        const config = this.getConfigForStorage(storageType);
        return config?.customEncode?.(value) ?? value;
      }

      case 'default':
      default: {
        return value;
      }
    }
  }

  /**
   * Decodes a value from storage based on the configured encoding strategy.
   *
   * @param value - The value to decode.
   * @param storageType - The storage type ('localStorage', 'sessionStorage', or 'cookies').
   * @param skipDecoding - If true, bypass decoding regardless of configuration.
   * @param errorContext - Context for error messages (e.g., 'localStorage', 'cookie').
   * @returns The decoded value.
   */
  decode(
    value: string,
    storageType: StorageType,
    skipDecoding: boolean = false,
    errorContext: string = 'storage'
  ): string {
    if (skipDecoding) {
      return value;
    }

    const encoding = this.getEncodingForStorage(storageType);

    try {
      switch (encoding) {
        case 'base64': {
          return isPlatformBrowser(this.platformId) ? atob(value) : value;
        }

        case 'custom': {
          const config = this.getConfigForStorage(storageType);
          return config?.customDecode?.(value) ?? value;
        }

        case 'default':
        default: {
          return value;
        }
      }
    } catch (error) {
      console.error(`Failed to decode ${errorContext} value:`, error);
      return value;
    }
  }

  /**
   * Gets the encoding configuration for a specific storage type.
   *
   * @param storageType - The storage type.
   * @returns The encoding configuration.
   */
  private getConfigForStorage(storageType: StorageType) {
    return this.globalConfig?.[storageType] ?? this.globalConfig?.common;
  }

  /**
   * Gets the encoding type for a specific storage type.
   *
   * @param storageType - The storage type.
   * @returns The encoding type.
   */
  private getEncodingForStorage(storageType: StorageType): CatbeeStorageEncodingConfig['encoding'] {
    const config = this.getConfigForStorage(storageType);
    return config?.encoding ?? 'default';
  }
}
