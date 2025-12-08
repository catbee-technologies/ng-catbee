/**
 * Log levels for the Catbee logger.
 * Follows RFC 5424 syslog severity levels.
 *
 * @public
 */
export enum CatbeeLogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
  OFF = 100
}

/**
 * Structured log entry metadata.
 *
 * @public
 */
export interface LogContext {
  /** Optional logger name/identifier */
  name?: string;
  /** Request ID or correlation ID for tracing */
  requestId?: string;
  /** User ID or session ID */
  userId?: string;
  /** Environment (development, production, etc.) */
  env?: string;
  /** Hostname or instance ID */
  hostname?: string;
  /** Process ID (server-side) */
  pid?: number;
  /** Any additional custom fields */
  [key: string]: unknown;
}

/**
 * Serializer function for transforming objects before logging.
 *
 * @public
 */
export type Serializer = (obj: unknown) => unknown;

/**
 * Transport interface for handling log output.
 *
 * @public
 */
export interface LogTransport {
  /** Transport name for identification */
  readonly name: string;
  /** Minimum level this transport handles */
  readonly level: CatbeeLogLevel;
  /** Write a log entry */
  write(entry: LogEntry): void | Promise<void>;
  /** Optional cleanup when logger is disposed */
  destroy?(): void | Promise<void>;
}

/**
 * Complete log entry structure.
 *
 * @public
 */
export interface LogEntry {
  /** Log level */
  level: CatbeeLogLevel;
  /** Timestamp in milliseconds since epoch or ISO string */
  time?: number | string;
  /** Log message */
  msg: string;
  /** Logger name or scope */
  name?: string;
  /** Hierarchical context path for child loggers */
  contextPath?: string[];
  /** Additional structured data */
  context?: LogContext;
  /** Error object (if logging an error) */
  err?: SerializedError;
  /** Any additional fields */
  [key: string]: unknown;
}

/**
 * Serialized error structure.
 *
 * @public
 */
export interface SerializedError {
  type: string;
  message: string;
  stack?: string;
  code?: string | number;
  [key: string]: unknown;
}

/**
 * HTTP request serialization structure.
 *
 * @public
 */
export interface SerializedRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
  remoteAddress?: string;
  remotePort?: number;
}

/**
 * HTTP response serialization structure.
 *
 * @public
 */
export interface SerializedResponse {
  statusCode?: number;
  headers?: Record<string, string | string[]>;
}

/**
 * Configuration options for the logger service.
 *
 * @public
 */
export interface CatbeeLoggerConfig {
  /** Minimum log level to output. Default: DEBUG in dev mode, WARN in production */
  level?: CatbeeLogLevel;
  /** Logger name/identifier */
  name?: string;
  /** Base context that will be merged with all log entries */
  base?: LogContext;
  /** Custom serializers for specific keys */
  serializers?: Record<string, Serializer>;
  /** Transports for log output. If not specified, uses console transport */
  transports?: LogTransport[];
  /** Whether to enable colored output (for console transport). Default: true */
  useColors?: boolean;
  /** Whether to pretty-print logs (for console transport). Default: true in dev */
  prettyPrint?: boolean;
  /** Maximum depth for object serialization. Default: 5 */
  maxDepth?: number;
  /** Whether to redact sensitive data. Default: true */
  redactSensitive?: boolean;
  /** Custom redaction paths (e.g., ['password', 'creditCard']) */
  redactPaths?: string[];
  /** Whether to include timestamps. Default: true */
  includeTimestamp?: boolean;
  /** Timestamp format for JSON mode. Default: 'iso' */
  timestampFormat?: 'iso' | 'epoch';
  /** Whether to include hostname. Default: false */
  includeHostname?: boolean;
  /** Whether to include PID (server-side). Default: false */
  includePid?: boolean;
  /** Custom timestamp function. Can return epoch milliseconds or ISO string */
  timestamp?: () => number | string;
  /** Maximum batch size for async transports. Default: 100 */
  batchSize?: number;
  /** Flush interval in ms for async transports. Default: 1000 */
  flushInterval?: number;
}
