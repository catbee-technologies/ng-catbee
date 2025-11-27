/**
 * Storage encoding configuration for localStorage, sessionStorage, and cookies.
 *
 * @public
 */
export interface StorageEncodingConfig {
  /** Encoding type: 'default' (URI encoding), 'base64', 'custom', or 'none' (no encoding) */
  encoding?: 'default' | 'base64' | 'custom' | 'none';
  /** Custom encode function (required if encoding is 'custom') */
  customEncode?: (value: string) => string;
  /** Custom decode function (required if encoding is 'custom') */
  customDecode?: (value: string) => string;
}

/**
 * Per-service storage configurations.
 *
 * @public
 */
export interface StorageServiceConfig {
  /** Configuration for localStorage */
  localStorage?: StorageEncodingConfig;
  /** Configuration for sessionStorage */
  sessionStorage?: StorageEncodingConfig;
  /** Configuration for cookies */
  cookies?: StorageEncodingConfig;
  /** Common configuration applied to all storage services if individual config not specified */
  common?: StorageEncodingConfig;
}

/**
 * Storage type for encoding/decoding configuration.
 *
 * @public
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies';
