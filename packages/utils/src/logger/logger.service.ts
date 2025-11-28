import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { CATBEE_UTILS_CONFIG } from '@ng-catbee/utils/config';
import { LoggerConfig, LogLevel } from '@ng-catbee/utils/types';

/**
 * Service for structured logging with SSR support and configurable log levels.
 *
 * This service provides a robust logging solution that works in both browser and SSR environments.
 * It supports different log levels, custom formatting, and can be configured per environment.
 *
 * Configuration can be provided in two ways:
 * 1. Using the provideCatbeeUtils() function (recommended for app-wide settings)
 * 2. Using the configure() method at runtime
 *
 * @example
 * ```typescript
 * // Method 1: Using provideCatbeeUtils in app.config.ts
 * import { provideCatbeeUtils, LogLevel } from '@catbee/utils';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeUtils({
 *       logger: {
 *         loggerLevel: LogLevel.INFO,
 *         prefix: '[MyApp]',
 *         useColors: true,
 *         timestampFormat: 'time'
 *       }
 *     })
 *   ]
 * };
 *
 * // Method 2: Using configure() method
 * constructor(private logger: LoggerService) {
 *   this.logger.configure({ prefix: '[MyComponent]' });
 *
 *   this.logger.debug('Debug message');
 *   this.logger.info('Information message');
 *   this.logger.warn('Warning message');
 *   this.logger.error('Error message', new Error('S
 * omething went wrong'));
 * }
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly globalConfig = inject(CATBEE_UTILS_CONFIG, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  private config: LoggerConfig;

  constructor() {
    // Initialize config with global config values or defaults
    this.config = {
      loggerLevel: isDevMode() ? LogLevel.DEBUG : LogLevel.WARN,
      includeTimestamp: true,
      includeLevel: true,
      prefix: '',
      useColors: true,
      timestampFormat: 'time',
      ...this.globalConfig?.logger
    };
  }

  /** ANSI color codes for different log levels */
  private readonly colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m', // Green
    WARN: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m', // Reset
    GRAY: '\x1b[90m', // Gray for timestamps
    BOLD: '\x1b[1m' // Bold
  };

  /** CSS styles for browser console */
  private readonly browserStyles = {
    DEBUG: 'color: #00BCD4; font-weight: bold',
    INFO: 'color: #4CAF50; font-weight: bold',
    WARN: 'color: #FF9800; font-weight: bold',
    ERROR: 'color: #F44336; font-weight: bold',
    timestamp: 'color: #9E9E9E; font-weight: normal',
    prefix: 'color: #2196F3; font-weight: bold'
  };

  /**
   * Configures the logger service.
   *
   * This method merges the provided configuration with the existing configuration.
   * Can be used to override injected configuration or set configuration at runtime.
   *
   * @param config - Configuration options to merge with existing config.
   *
   * @example
   * ```typescript
   * this.logger.configure({
   *   loggerLevel: LogLevel.INFO,
   *   prefix: '[MyApp]',
   *   includeTimestamp: false
   * });
   * ```
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current logger configuration.
   *
   * @returns The current configuration object.
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Logs a debug message.
   *
   * Debug messages are only shown in development mode by default.
   *
   * @param message - The message to log.
   * @param optionalParams - Additional parameters to log.
   *
   * @example
   * ```typescript
   * this.logger.debug('User data loaded', userData);
   * ```
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * Logs an informational message.
   *
   * @param message - The message to log.
   * @param optionalParams - Additional parameters to log.
   *
   * @example
   * ```typescript
   * this.logger.info('Application started');
   * ```
   */
  info(message: string, ...optionalParams: unknown[]): void {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * Logs a warning message.
   *
   * @param message - The message to log.
   * @param optionalParams - Additional parameters to log.
   *
   * @example
   * ```typescript
   * this.logger.warn('API response took longer than expected', duration);
   * ```
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * Logs an error message.
   *
   * @param message - The error message to log.
   * @param error - Optional error object.
   * @param optionalParams - Additional parameters to log.
   *
   * @example
   * ```typescript
   * this.logger.error('Failed to fetch data', error);
   * ```
   */
  error(message: string, error?: Error | unknown, ...optionalParams: unknown[]): void {
    if (error) {
      this.log(LogLevel.ERROR, message, error, ...optionalParams);
    } else {
      this.log(LogLevel.ERROR, message, ...optionalParams);
    }
  }

  /**
   * Logs a message with a specific log level.
   *
   * @param level - The log level.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters to log.
   */
  private log(level: LogLevel, message: string, ...optionalParams: unknown[]): void {
    if (level < this.config.loggerLevel!) {
      return;
    }

    const params = optionalParams.length > 0 ? optionalParams : [];

    // Use browser-specific styling if in browser
    if (isPlatformBrowser(this.platformId) && this.config.useColors) {
      this.logWithBrowserColors(level, message, params);
    } else {
      this.logWithAnsiColors(level, message, params);
    }
  }

  /**
   * Logs with browser console styling (CSS).
   *
   * @param level - The log level.
   * @param message - The message to log.
   * @param params - Additional parameters.
   */
  private logWithBrowserColors(level: LogLevel, message: string, params: unknown[]): void {
    const levelLabel = LogLevel[level];
    const timestamp = this.getFormattedTimestamp();
    const parts: string[] = [];
    const styles: string[] = [];

    // Build formatted message with %c placeholders for styling
    if (this.config.includeTimestamp) {
      parts.push('%c' + timestamp);
      styles.push(this.browserStyles.timestamp);
    }

    if (this.config.includeLevel) {
      parts.push('%c[' + levelLabel + ']');
      styles.push(this.browserStyles[levelLabel as keyof typeof this.browserStyles] as string);
    }

    if (this.config.prefix) {
      parts.push('%c' + this.config.prefix);
      styles.push(this.browserStyles.prefix);
    }

    parts.push('%c' + message);
    styles.push('color: inherit; font-weight: normal');

    const formattedMessage = parts.join(' ');

    // Use appropriate console method based on log level
    switch (level) {
      case LogLevel.DEBUG:
        console.log(formattedMessage, ...styles, ...params);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...styles, ...params);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...styles, ...params);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...styles, ...params);
        break;
    }
  }

  /**
   * Logs with ANSI color codes (for Node.js/terminal).
   *
   * @param level - The log level.
   * @param message - The message to log.
   * @param params - Additional parameters.
   */
  private logWithAnsiColors(level: LogLevel, message: string, params: unknown[]): void {
    const formattedMessage = this.config.useColors
      ? this.formatMessageWithAnsiColors(level, message)
      : this.formatMessage(level, message);

    // Use appropriate console method based on log level
    switch (level) {
      case LogLevel.DEBUG:
        console.log(formattedMessage, ...params);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...params);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...params);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...params);
        break;
    }
  }

  /**
   * Formats a log message with ANSI color codes.
   *
   * @param level - The log level.
   * @param message - The raw message.
   * @returns The formatted message string with ANSI colors.
   */
  private formatMessageWithAnsiColors(level: LogLevel, message: string): string {
    const parts: string[] = [];
    const levelLabel = LogLevel[level];
    const levelColor = this.colors[levelLabel as keyof typeof this.colors] as string;

    if (this.config.includeTimestamp) {
      const timestamp = this.getFormattedTimestamp();
      parts.push(`${this.colors.GRAY}${timestamp}${this.colors.RESET}`);
    }

    if (this.config.includeLevel) {
      parts.push(`${levelColor}${this.colors.BOLD}[${levelLabel}]${this.colors.RESET}`);
    }

    if (this.config.prefix) {
      parts.push(`${this.colors.BOLD}${this.config.prefix}${this.colors.RESET}`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Formats a log message with timestamp, level, and prefix (no colors).
   *
   * @param level - The log level.
   * @param message - The raw message.
   * @returns The formatted message string.
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      const timestamp = this.getFormattedTimestamp();
      parts.push(timestamp);
    }

    if (this.config.includeLevel) {
      const levelLabel = LogLevel[level];
      parts.push(`[${levelLabel}]`);
    }

    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Gets a formatted timestamp based on configuration.
   *
   * @returns The formatted timestamp string.
   */
  private getFormattedTimestamp(): string {
    const now = new Date();

    switch (this.config.timestampFormat) {
      case 'iso':
        return now.toISOString();
      case 'time':
        return now.toLocaleTimeString('en-US', { hour12: false });
      case 'full':
        return now.toLocaleString();
      default:
        return now.toLocaleTimeString('en-US', { hour12: false });
    }
  }

  /**
   * Creates a scoped logger with a specific prefix.
   *
   * Useful for creating loggers for specific modules or components.
   *
   * @param scope - The scope name to use as prefix.
   * @returns A new logger service instance with the scoped prefix.
   *
   * @example
   * ```typescript
   * const userLogger = this.logger.createScope('UserService');
   * userLogger.info('User logged in'); // Outputs: [UserService] User logged in
   * ```
   */
  createScope(scope: string): LoggerService {
    const scopedLogger = new LoggerService();
    scopedLogger.configure({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix} [${scope}]` : `[${scope}]`
    });
    return scopedLogger;
  }

  /** Map to store timer start times (supports multiple instances of same label) */
  private readonly timers = new Map<string, number[]>();

  /**
   * Starts a timer for performance measurement.
   * Supports multiple concurrent timers with the same label using a stack-based approach.
   *
   * @param label - The label for the timer.
   *
   * @example
   * ```typescript
   * this.logger.time('dataFetch');
   * await fetchData();
   * this.logger.timeEnd('dataFetch'); // Outputs: dataFetch: 123.45ms
   *
   * // Multiple timers with same label
   * this.logger.time('api');
   * this.logger.time('api'); // Nested
   * await fetchData();
   * this.logger.timeEnd('api'); // Ends second timer
   * this.logger.timeEnd('api'); // Ends first timer
   * ```
   */
  time(label: string): void {
    const now = performance.now();
    const timers = this.timers.get(label);

    if (timers) {
      timers.push(now);
    } else {
      this.timers.set(label, [now]);
    }

    if (isPlatformBrowser(this.platformId) && this.config.useColors) {
      console.log(`%c⏱️ ${label}%c: Timer started`, 'color: #9C27B0; font-weight: bold', 'color: #9E9E9E');
    } else if (this.config.useColors) {
      console.log(
        `${this.colors.BOLD}\x1b[35m⏱️ ${label}${this.colors.RESET}${this.colors.GRAY}: Timer started${this.colors.RESET}`
      );
    } else {
      console.log(`⏱️ ${label}: Timer started`);
    }
  }

  /**
   * Ends a timer and logs the elapsed time.
   * Uses LIFO (Last In, First Out) for handling multiple timers with the same label.
   *
   * @param label - The label for the timer to end.
   */
  timeEnd(label: string): void {
    const timers = this.timers.get(label);
    if (!timers || timers.length === 0) {
      console.warn(`Timer '${label}' does not exist`);
      return;
    }

    const startTime = timers.pop()!;
    const duration = performance.now() - startTime;

    // Clean up if no more timers for this label
    if (timers.length === 0) {
      this.timers.delete(label);
    }

    if (isPlatformBrowser(this.platformId) && this.config.useColors) {
      console.log(
        `%c⏱️ ${label}%c: %c${duration.toFixed(2)}ms`,
        'color: #9C27B0; font-weight: bold',
        'color: #9E9E9E',
        'color: #4CAF50; font-weight: bold'
      );
    } else if (this.config.useColors) {
      console.log(
        `${this.colors.BOLD}\x1b[35m⏱️ ${label}${this.colors.RESET}${this.colors.GRAY}: ${this.colors.RESET}${this.colors.INFO}${duration.toFixed(2)}ms${this.colors.RESET}`
      );
    } else {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Logs a table of data (browser only).
   *
   * @param data - The data to display in table format.
   *
   * @example
   * ```typescript
   * this.logger.table([
   *   { name: 'John', age: 30 },
   *   { name: 'Jane', age: 25 }
   * ]);
   * ```
   */
  table(data: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      console.table(data);
    }
  }

  /**
   * Creates a collapsed group of log messages.
   *
   * @param label - The group label.
   *
   * @example
   * ```typescript
   * this.logger.group('API Response');
   * this.logger.info('Status:', 200);
   * this.logger.info('Data:', data);
   * this.logger.groupEnd();
   * ```
   */
  group(label: string): void {
    console.group(label);
  }

  /**
   * Creates an expanded group of log messages.
   *
   * @param label - The group label.
   */
  groupCollapsed(label: string): void {
    console.groupCollapsed(label);
  }

  /**
   * Ends the current log group.
   */
  groupEnd(): void {
    console.groupEnd();
  }

  /**
   * Clears the console.
   */
  clear(): void {
    console.clear();
  }
}
