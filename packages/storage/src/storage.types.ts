/**
 * Storage encoding configuration for localStorage, sessionStorage, and cookies.
 *
 * @public
 */
export interface CatbeeStorageEncodingConfig {
  /** Encoding type: 'default', 'base64', 'custom' */
  encoding?: 'default' | 'base64' | 'custom';
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
export interface CatbeeStorageConfig {
  /** Configuration for localStorage */
  localStorage?: CatbeeStorageEncodingConfig;
  /** Configuration for sessionStorage */
  sessionStorage?: CatbeeStorageEncodingConfig;
  /** Common configuration applied to all storage services if individual config not specified */
  common?: CatbeeStorageEncodingConfig;
}

/**
 * Storage type for encoding/decoding configuration.
 *
 * @public
 */
export type StorageType = 'localStorage' | 'sessionStorage';
