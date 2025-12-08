import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, isDevMode, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CATBEE_LOGGER_CONFIG } from './logger.config';
import {
  CatbeeLoggerConfig,
  CatbeeLogLevel,
  LogContext,
  LogEntry,
  LogTransport,
  SerializedError,
  Serializer
} from './logger.types';
import { ConsoleTransport } from './transports/console.transport';
import { defaultSerializers, createObjectSerializer, createRedactSerializer } from './serializers';

/**
 * Production-ready logger service with SSR support, structured logging, and multiple transports.
 *
 * Inspired by Pino, this logger provides:
 * - Structured JSON logging
 * - Multiple transports (console, HTTP, custom)
 * - Child loggers with inherited context
 * - Serializers for errors, requests, responses
 * - Batching and async transport support
 * - Redaction of sensitive data
 * - Zero dependencies (except Angular)
 *
 * @example
 * ```typescript
 * // Basic usage
 * constructor(private logger: CatbeeLogger) {
 *   this.logger.info('User logged in', { userId: 123 });
 *   this.logger.error('Failed to fetch data', { err: error });
 * }
 *
 * // Child logger with context
 * const userLogger = this.logger.child({ userId: 123, module: 'UserService' });
 * userLogger.info('User action'); // Automatically includes userId and module
 *
 * // Custom serializer
 * this.logger.configure({
 *   serializers: {
 *     user: (user) => ({ id: user.id, name: user.name })
 *   }
 * });
 * this.logger.info('User details', { user: complexUserObject });
 * ```
 *
 * @public
 */
@Injectable({
  providedIn: 'root'
})
export class CatbeeLogger implements OnDestroy {
  private readonly globalConfig = inject(CATBEE_LOGGER_CONFIG, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  private config: CatbeeLoggerConfig;
  private transports: LogTransport[];
  private serializers: Record<string, Serializer>;
  private baseContext: LogContext;
  private readonly isBrowser: boolean;
  private contextPath: string[] = [];

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Default configuration
    const defaultConfig: CatbeeLoggerConfig = {
      level: isDevMode() ? CatbeeLogLevel.DEBUG : CatbeeLogLevel.WARN,
      useColors: true,
      prettyPrint: isDevMode(),
      maxDepth: 5,
      redactSensitive: true,
      includeTimestamp: true,
      timestampFormat: 'iso',
      includeHostname: false,
      includePid: false,
      batchSize: 100,
      flushInterval: 1000
    };

    this.config = { ...defaultConfig, ...this.globalConfig };

    // Initialize base context
    this.baseContext = this.config.base || {};

    // Add hostname and PID if configured (server-side only)
    if (!this.isBrowser) {
      if (this.config.includeHostname && typeof process !== 'undefined') {
        this.baseContext.hostname = process.env['HOSTNAME'] || 'unknown';
      }
      if (this.config.includePid && typeof process !== 'undefined') {
        this.baseContext.pid = process.pid;
      }
    }

    // Initialize serializers
    this.serializers = {
      ...defaultSerializers,
      ...this.config.serializers
    };

    // Add redaction serializer if enabled
    if (this.config.redactSensitive) {
      const redactSerializer = createRedactSerializer(this.config.redactPaths);
      const objectSerializer = createObjectSerializer(this.config.maxDepth);

      // Wrap object serializer with redaction
      this.serializers['_default'] = (obj: unknown) => {
        const serialized = objectSerializer(obj);
        return redactSerializer(serialized);
      };
    } else {
      this.serializers['_default'] = createObjectSerializer(this.config.maxDepth);
    }

    // Initialize transports
    if (this.config.transports && this.config.transports.length > 0) {
      this.transports = this.config.transports;
    } else {
      // Default to console transport
      this.transports = [
        new ConsoleTransport(
          {
            level: this.config.level,
            useColors: this.config.useColors,
            prettyPrint: this.config.prettyPrint
          },
          this.platformId
        )
      ];
    }
  }

  /**
   * Configures the logger service.
   *
   * This method merges the provided configuration with the existing configuration.
   *
   * @param config - Configuration options to merge with existing config.
   */
  configure(config: Partial<CatbeeLoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Update serializers if provided
    if (config.serializers) {
      this.serializers = { ...this.serializers, ...config.serializers };
    }

    // Update base context if provided
    if (config.base) {
      this.baseContext = { ...this.baseContext, ...config.base };
    }

    // Update transports if provided
    if (config.transports) {
      this.transports = config.transports;
    }
  }

  /**
   * Gets the current logger configuration.
   */
  getConfig(): Readonly<CatbeeLoggerConfig> {
    return { ...this.config };
  }

  /**
   * Creates a child logger with additional context.
   *
   * Child loggers inherit all configuration and base context from the parent,
   * and add their own context that is merged with every log entry.
   *
   * @param bindingsOrName - Context bindings object or a string name for hierarchical logging.
   * @returns A new child logger instance.
   *
   * @example
   * ```typescript
   * // Object-based child logger
   * const userLogger = this.logger.child({ userId: 123, module: 'UserService' });
   * userLogger.info('User logged in'); // Includes userId and module in context
   *
   * // String-based hierarchical logger
   * const mainLogger = this.logger.child('Main');
   * const childLogger = mainLogger.child('Child');
   * childLogger.info('Message'); // Displays as: Main > Child Message
   * ```
   */
  child(bindingsOrName: LogContext | string): CatbeeLogger {
    const childLogger = Object.create(CatbeeLogger.prototype);
    childLogger.config = { ...this.config };
    childLogger.serializers = { ...this.serializers };
    childLogger.transports = this.transports; // Share transports
    childLogger.isBrowser = this.isBrowser;
    childLogger.timers = new Map<string, number[]>();

    if (typeof bindingsOrName === 'string') {
      // String-based hierarchical logger
      childLogger.contextPath = [...this.contextPath, bindingsOrName];
      childLogger.baseContext = { ...this.baseContext };
    } else {
      // Object-based logger with bindings
      childLogger.contextPath = [...this.contextPath];
      childLogger.baseContext = { ...this.baseContext, ...bindingsOrName };
    }

    return childLogger;
  }

  /**
   * Logs a trace message (lowest level).
   *
   * @param message - The message to log.
   * @param context - Additional context or data.
   */
  trace(message: string, context?: LogContext | unknown): void {
    this.log(CatbeeLogLevel.TRACE, message, context);
  }

  /**
   * Logs a debug message.
   *
   * @param message - The message to log.
   * @param context - Additional context or data.
   */
  debug(message: string, context?: LogContext | unknown): void {
    this.log(CatbeeLogLevel.DEBUG, message, context);
  }

  /**
   * Logs an informational message.
   *
   * @param message - The message to log.
   * @param context - Additional context or data.
   */
  info(message: string, context?: LogContext | unknown): void {
    this.log(CatbeeLogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message.
   *
   * @param message - The message to log.
   * @param context - Additional context or data.
   */
  warn(message: string, context?: LogContext | unknown): void {
    this.log(CatbeeLogLevel.WARN, message, context);
  }

  /**
   * Logs an error message.
   *
   * @param message - The error message to log.
   * @param errorOrContext - Error object or additional context.
   * @param context - Additional context (if first param is an error).
   */
  error(message: string, errorOrContext?: Error | unknown, context?: LogContext | unknown): void {
    if (errorOrContext instanceof Error) {
      this.log(CatbeeLogLevel.ERROR, message, { err: errorOrContext, ...(context as LogContext) });
    } else {
      this.log(CatbeeLogLevel.ERROR, message, errorOrContext);
    }
  }

  /**
   * Logs a fatal error message (highest level).
   *
   * @param message - The error message to log.
   * @param errorOrContext - Error object or additional context.
   * @param context - Additional context (if first param is an error).
   */
  fatal(message: string, errorOrContext?: Error | unknown, context?: LogContext | unknown): void {
    if (errorOrContext instanceof Error) {
      this.log(CatbeeLogLevel.FATAL, message, { err: errorOrContext, ...(context as LogContext) });
    } else {
      this.log(CatbeeLogLevel.FATAL, message, errorOrContext);
    }
  }

  /**
   * Core logging method.
   */
  private log(level: CatbeeLogLevel, message: string, context?: LogContext | unknown): void {
    if (level < (this.config.level ?? CatbeeLogLevel.TRACE)) {
      return;
    }

    // Create log entry
    const entry: Partial<LogEntry> = {
      level
    };

    // Add timestamp if enabled
    if (this.config.includeTimestamp !== false) {
      if (this.config.timestamp) {
        entry.time = this.config.timestamp();
      } else {
        // Use timestampFormat to determine format
        if (this.config.timestampFormat === 'epoch') {
          entry.time = Date.now();
        } else {
          // Default to ISO string
          entry.time = new Date().toISOString();
        }
      }
    }

    entry.msg = message;
    entry.name = this.config.name;
    entry.contextPath = this.contextPath.length > 0 ? this.contextPath : undefined;

    // Merge base context
    if (Object.keys(this.baseContext).length > 0) {
      entry.context = { ...this.baseContext };
    }

    // Process additional context/data
    if (context) {
      const serialized = this.serializeContext(context);

      // If context contains standard fields, extract them
      if (typeof serialized === 'object' && serialized !== null) {
        const ctx = serialized as Record<string, unknown>;

        // Extract error if present
        if (ctx['err'] || ctx['error']) {
          const err = ctx['err'] || ctx['error'];
          // Store original error for browser console (non-enumerable to hide from output)
          if (err instanceof Error) {
            Object.defineProperty(entry, '_originalError', {
              value: err,
              enumerable: false,
              writable: false,
              configurable: true
            });
          }
          // Serialize for structured logging
          if (this.serializers['err']) {
            entry.err = this.serializers['err'](err) as SerializedError;
          }
          delete ctx['err'];
          delete ctx['error'];
        }

        // Extract request if present
        if (ctx['req'] || ctx['request']) {
          const req = ctx['req'] || ctx['request'];
          if (this.serializers['req']) {
            entry['req'] = this.serializers['req'](req);
          }
          delete ctx['req'];
          delete ctx['request'];
        }

        // Extract response if present
        if (ctx['res'] || ctx['response']) {
          const res = ctx['res'] || ctx['response'];
          if (this.serializers['res']) {
            entry['res'] = this.serializers['res'](res);
          }
          delete ctx['res'];
          delete ctx['response'];
        }

        // Merge remaining fields into context or entry
        for (const [key, value] of Object.entries(ctx)) {
          if (key === 'context' && typeof value === 'object') {
            entry.context = { ...entry.context, ...(value as LogContext) };
          } else {
            entry[key] = value;
          }
        }
      }
    }

    // Write to all transports
    this.writeToTransports(entry as LogEntry);
  }

  /**
   * Serialize context using configured serializers.
   */
  private serializeContext(context: unknown): unknown {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context as Record<string, unknown>)) {
      // Special handling for err, req, res - pass them through without serialization
      // They will be serialized later in the log() method with their specific serializers
      if (
        key === 'err' ||
        key === 'error' ||
        key === 'req' ||
        key === 'request' ||
        key === 'res' ||
        key === 'response'
      ) {
        result[key] = value;
      } else if (this.serializers[key]) {
        result[key] = this.serializers[key](value);
      } else if (this.serializers['_default']) {
        result[key] = this.serializers['_default'](value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Write log entry to all transports.
   */
  private writeToTransports(entry: LogEntry): void {
    for (const transport of this.transports) {
      try {
        if (entry.level >= transport.level) {
          const result = transport.write(entry);

          // Handle async transports
          if (result instanceof Promise) {
            result.catch(err => {
              console.error(`[CatbeeLogger] Transport "${transport.name}" failed:`, err);
            });
          }
        }
      } catch (err) {
        console.error(`[CatbeeLogger] Transport "${transport.name}" error:`, err);
      }
    }
  }

  /** Map to store timer start times */
  private readonly timers = new Map<string, number[]>();

  /**
   * Starts a performance timer.
   *
   * @param label - The timer label.
   *
   * @example
   * ```typescript
   * this.logger.time('api-call');
   * await fetchData();
   * this.logger.timeEnd('api-call'); // Logs: api-call: 123.45ms
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

    this.trace(`Timer started: ${label}`);
  }

  /**
   * Ends a performance timer and logs the duration.
   *
   * @param label - The timer label to end.
   */
  timeEnd(label: string): void {
    const timers = this.timers.get(label);
    if (!timers || timers.length === 0) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }

    const startTime = timers.pop()!;
    const duration = performance.now() - startTime;

    if (timers.length === 0) {
      this.timers.delete(label);
    }

    this.debug(`${label}: ${duration.toFixed(2)}ms`, { duration, label });
  }

  /**
   * Flush all async transports immediately.
   *
   * Useful before application shutdown to ensure all logs are sent.
   *
   * @example
   * ```typescript
   * await this.logger.flush();
   * ```
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const transport of this.transports) {
      if (transport.destroy) {
        const result = transport.destroy();
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Cleanup transports on destroy.
   */
  ngOnDestroy(): void {
    this.transports.forEach(transport => {
      if (transport.destroy) {
        const result = transport.destroy();
        if (result instanceof Promise) {
          result.catch(err => console.error('[CatbeeLogger] Transport cleanup failed:', err));
        }
      }
    });
  }
}
