/**
 * Log levels for categorizing log messages.
 *
 * @public
 */
export enum LogLevel {
  /** Verbose debugging information */
  DEBUG = -1,
  /** Informational messages */
  INFO = 1,
  /** Warning messages */
  WARN = 2,
  /** Error messages */
  ERROR = 3,
  /** No logging */
  NONE = 4
}

/**
 * Configuration options for the logger service.
 *
 * @public
 */
export interface LoggerConfig {
  /** Minimum log level to output. Default: LogLevel.DEBUG in dev mode, LogLevel.WARN in production */
  loggerLevel?: LogLevel;
  /** Whether to include timestamps in log messages. Default: true */
  includeTimestamp?: boolean;
  /** Whether to include log level labels. Default: true */
  includeLevel?: boolean;
  /** Custom prefix for all log messages */
  prefix?: string;
  /** Whether to use colored output in console. Default: true */
  useColors?: boolean;
  /** Timestamp format: 'iso' for full ISO string, 'time' for HH:mm:ss, 'full' for locale string. Default: 'time' */
  timestampFormat?: 'iso' | 'time' | 'full';
}
