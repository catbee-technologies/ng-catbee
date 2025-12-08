import { isPlatformBrowser } from '@angular/common';
import { CatbeeLogLevel, LogEntry, LogTransport } from '../logger.types';

/**
 * Console transport options.
 *
 * @public
 */
export interface ConsoleTransportOptions {
  /** Minimum log level */
  level?: CatbeeLogLevel;
  /** Whether to use colors */
  useColors?: boolean;
  /** Whether to pretty-print (human-readable format) */
  prettyPrint?: boolean;
}

/**
 * Console transport for logging to browser console or Node.js console.
 * Optimized for both environments with appropriate styling.
 *
 * @public
 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console';
  readonly level: CatbeeLogLevel;

  private readonly useColors: boolean;
  private readonly prettyPrint: boolean;
  private readonly isBrowser: boolean;

  /** Browser console CSS styles */
  private readonly browserStyles = {
    TRACE: 'color: #9E9E9E; font-weight: normal',
    DEBUG: 'color: #00BCD4; font-weight: bold',
    INFO: 'color: #4CAF50; font-weight: bold',
    WARN: 'color: #FF9800; font-weight: bold',
    ERROR: 'color: #F44336; font-weight: bold',
    FATAL: 'color: #D32F2F; font-weight: bold; background: #FFCDD2',
    time: 'color: #9E9E9E; font-size: 0.9em',
    name: 'color: #2196F3; font-weight: bold',
    contextPath: 'color: #9C27B0; font-weight: bold'
  };

  /** ANSI color codes for terminal */
  private readonly ansiColors = {
    TRACE: '\x1b[90m',
    DEBUG: '\x1b[36m',
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    FATAL: '\x1b[97m\x1b[41m',
    RESET: '\x1b[0m',
    GRAY: '\x1b[90m',
    BLUE: '\x1b[34m',
    BOLD: '\x1b[1m',
    MAGENTA: '\x1b[35m'
  };

  constructor(options: ConsoleTransportOptions = {}, platformId?: object) {
    this.level = options.level ?? CatbeeLogLevel.TRACE;
    this.useColors = options.useColors ?? true;
    this.prettyPrint = options.prettyPrint ?? true;
    this.isBrowser = platformId ? isPlatformBrowser(platformId) : typeof window !== 'undefined';
  }

  write(entry: LogEntry): void {
    if (entry.level < this.level) {
      return;
    }

    if (this.prettyPrint) {
      if (this.isBrowser) this.writePrettyBrowser(entry);
      else this.writePrettyNode(entry);
    } else {
      this.writeJson(entry);
    }
  }

  /**
   * Write pretty-printed log for browser console.
   *
   * @param entry Log entry to write
   */
  private writePrettyBrowser(entry: LogEntry): void {
    const levelName = CatbeeLogLevel[entry.level];
    const parts: string[] = [];
    const styles: string[] = [];

    if (this.useColors) {
      // Time (if present)
      if (entry.time !== undefined) {
        const time = typeof entry.time === 'string' ? entry.time : new Date(entry.time).toISOString();
        parts.push('%c' + time);
        styles.push(this.browserStyles.time);
      }

      // Level
      parts.push('%c[' + levelName + ']');
      styles.push(this.browserStyles[levelName as keyof typeof this.browserStyles] as string);

      // Context Path (hierarchical child logger names)
      if (entry.contextPath && entry.contextPath.length > 0) {
        parts.push('%c' + entry.contextPath.join(' > '));
        styles.push(this.browserStyles.contextPath);
      }

      // Name/scope
      if (entry.name) {
        parts.push('%c' + entry.name);
        styles.push(this.browserStyles.name);
      }

      // Message
      parts.push('%c' + entry.msg);
      styles.push('color: inherit');
    } else {
      // No colors - plain text
      if (entry.time !== undefined) {
        const time = typeof entry.time === 'string' ? entry.time : new Date(entry.time).toISOString();
        parts.push(time);
      }
      parts.push('[' + levelName + ']');

      // Context Path (hierarchical child logger names)
      if (entry.contextPath && entry.contextPath.length > 0) {
        parts.push(entry.contextPath.join(' > '));
      }

      // Name/scope
      if (entry.name) {
        parts.push(entry.name);
      }

      parts.push(entry.msg);
    }

    const message = this.useColors ? parts.join(' ') : parts.join(' ');

    // Additional data
    const extras: unknown[] = [];
    if (entry.context && Object.keys(entry.context).length > 0) {
      extras.push(entry.context);
    }
    // In browser, use original Error object for interactive stack traces
    // In server/JSON mode, use serialized error
    if (entry.err) {
      const originalError = (entry as { _originalError?: unknown })._originalError;
      if (this.isBrowser && originalError instanceof Error) {
        extras.push(originalError);
      } else {
        extras.push(entry.err);
      }
    }

    // Add any other custom fields
    const customFields = this.getCustomFields(entry);
    if (Object.keys(customFields).length > 0) {
      extras.push(customFields);
    }

    // Use appropriate console method
    if (this.useColors) {
      this.callConsoleMethod(entry.level, message, ...styles, ...extras);
    } else {
      this.callConsoleMethod(entry.level, message, ...extras);
    }
  }

  /**
   * Write pretty-printed log for Node.js console.
   */
  private writePrettyNode(entry: LogEntry): void {
    const levelName = CatbeeLogLevel[entry.level];
    const parts: string[] = [];

    if (this.useColors) {
      const color = this.ansiColors[levelName as keyof typeof this.ansiColors] as string;

      // Time (if present)
      if (entry.time !== undefined) {
        const time = typeof entry.time === 'string' ? entry.time : new Date(entry.time).toISOString();
        parts.push(this.ansiColors.GRAY + time + this.ansiColors.RESET);
      }
      parts.push(color + this.ansiColors.BOLD + '[' + levelName + ']' + this.ansiColors.RESET);

      // Context Path (hierarchical child logger names)
      if (entry.contextPath && entry.contextPath.length > 0) {
        parts.push(
          this.ansiColors.MAGENTA + this.ansiColors.BOLD + entry.contextPath.join(' > ') + this.ansiColors.RESET
        );
      }

      if (entry.name) {
        parts.push(this.ansiColors.BLUE + entry.name + this.ansiColors.RESET);
      }

      parts.push(entry.msg);
    } else {
      if (entry.time !== undefined) {
        const time = typeof entry.time === 'string' ? entry.time : new Date(entry.time).toISOString();
        parts.push(time);
      }
      parts.push('[' + levelName + ']');

      // Context Path (hierarchical child logger names)
      if (entry.contextPath && entry.contextPath.length > 0) {
        parts.push(entry.contextPath.join(' > '));
      }

      if (entry.name) {
        parts.push(entry.name);
      }
      parts.push(entry.msg);
    }

    const message = parts.join(' ');

    // Additional data
    const extras: unknown[] = [];
    if (entry.context && Object.keys(entry.context).length > 0) {
      extras.push(entry.context);
    }
    if (entry.err) {
      extras.push(entry.err);
    }

    const customFields = this.getCustomFields(entry);
    if (Object.keys(customFields).length > 0) {
      extras.push(customFields);
    }

    this.callConsoleMethod(entry.level, message, ...extras);
  }

  /**
   * Write JSON-formatted log (Pino-style).
   */
  private writeJson(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    this.callConsoleMethod(entry.level, json);
  }

  /**
   * Get custom fields from log entry (excluding standard fields).
   */
  private getCustomFields(entry: LogEntry): Record<string, unknown> {
    const standardFields = ['level', 'time', 'msg', 'name', 'context', 'contextPath', 'err'];
    const custom: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(entry)) {
      if (!standardFields.includes(key)) {
        custom[key] = value;
      }
    }

    return custom;
  }

  /**
   * Call appropriate console method based on log level.
   */
  private callConsoleMethod(level: CatbeeLogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case CatbeeLogLevel.TRACE:
      case CatbeeLogLevel.DEBUG:
        // Use console.log in browser because console.debug is filtered by default
        // Use console.debug in Node.js for proper log level
        if (this.isBrowser) {
          console.log(message, ...args);
        } else {
          console.debug(message, ...args);
        }
        break;
      case CatbeeLogLevel.INFO:
        console.info(message, ...args);
        break;
      case CatbeeLogLevel.WARN:
        console.warn(message, ...args);
        break;
      case CatbeeLogLevel.ERROR:
      case CatbeeLogLevel.FATAL:
        console.error(message, ...args);
        break;
      default:
        console.log(message, ...args);
    }
  }
}
