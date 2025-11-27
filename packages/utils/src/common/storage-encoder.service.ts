import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { CATBEE_UTILS_CONFIG } from '@ng-catbee/utils/config';
import type { StorageType } from '@ng-catbee/utils/types';

/**
 * Shared encoding/decoding service for all storage types.
 *
 * This service provides configurable encoding/decoding strategies
 * for localStorage, sessionStorage, and cookies.
 *
 * @internal
 */
@Injectable({
  providedIn: 'root'
})
export class StorageEncoderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly globalConfig = inject(CATBEE_UTILS_CONFIG, { optional: true });

  /**
   * Encodes a value for storage based on the configured encoding strategy.
   *
   * @param value - The value to encode.
   * @param storageType - The storage type ('localStorage', 'sessionStorage', or 'cookies').
   * @param skipEncoding - If true, bypass encoding regardless of configuration.
   * @param useUriEncoding - Whether to apply URI encoding (for cookies).
   * @returns The encoded value.
   */
  encode(
    value: string,
    storageType: StorageType,
    skipEncoding: boolean = false,
    useUriEncoding: boolean = false
  ): string {
    if (skipEncoding) {
      return value;
    }

    const encoding = this.getEncodingForStorage(storageType);

    switch (encoding) {
      case 'base64': {
        if (useUriEncoding) {
          return isPlatformBrowser(this.platformId) ? btoa(encodeURIComponent(value)) : encodeURIComponent(value);
        }
        return isPlatformBrowser(this.platformId) ? btoa(value) : value;
      }

      case 'custom': {
        const config = this.getConfigForStorage(storageType);
        const encoded = config?.customEncode?.(value) ?? value;
        return useUriEncoding ? encodeURIComponent(encoded) : encoded;
      }

      case 'none': {
        return value;
      }

      case 'default':
      default: {
        return useUriEncoding ? encodeURIComponent(value) : value;
      }
    }
  }

  /**
   * Decodes a value from storage based on the configured encoding strategy.
   *
   * @param value - The value to decode.
   * @param storageType - The storage type ('localStorage', 'sessionStorage', or 'cookies').
   * @param skipDecoding - If true, bypass decoding regardless of configuration.
   * @param useUriEncoding - Whether to apply URI decoding (for cookies).
   * @param errorContext - Context for error messages (e.g., 'localStorage', 'cookie').
   * @returns The decoded value.
   */
  decode(
    value: string,
    storageType: StorageType,
    skipDecoding: boolean = false,
    useUriEncoding: boolean = false,
    errorContext: string = 'storage'
  ): string {
    if (skipDecoding) {
      return value;
    }

    const encoding = this.getEncodingForStorage(storageType);

    try {
      switch (encoding) {
        case 'base64': {
          if (useUriEncoding) {
            return isPlatformBrowser(this.platformId) ? decodeURIComponent(atob(value)) : decodeURIComponent(value);
          }
          return isPlatformBrowser(this.platformId) ? atob(value) : value;
        }

        case 'custom': {
          const config = this.getConfigForStorage(storageType);
          const decoded = useUriEncoding ? decodeURIComponent(value) : value;
          return config?.customDecode?.(decoded) ?? decoded;
        }

        case 'none': {
          return value;
        }

        case 'default':
        default: {
          return useUriEncoding ? decodeURIComponent(value) : value;
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
    return this.globalConfig?.storage?.[storageType] ?? this.globalConfig?.storage?.common;
  }

  /**
   * Gets the encoding type for a specific storage type.
   *
   * @param storageType - The storage type.
   * @returns The encoding type.
   */
  private getEncodingForStorage(storageType: StorageType): 'default' | 'base64' | 'custom' | 'none' {
    const config = this.getConfigForStorage(storageType);
    return config?.encoding ?? 'default';
  }
}
