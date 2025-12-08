# @catbee/logger - Technical Documentation

## Architecture Overview

The `@catbee/logger` is a production-ready logging library for Angular applications inspired by [Pino](https://getpino.io/). It provides structured logging, multiple transports, and works seamlessly in both browser and SSR environments.

## Core Components

### 1. CatbeeLogger Service (`logger.service.ts`)

The main logger service that provides:
- Structured logging methods (trace, debug, info, warn, error, fatal)
- Child logger creation with inherited context
- Performance timing utilities
- Transport management
- Serialization and redaction

**Key Methods:**
```typescript
trace(message: string, context?: LogContext | unknown): void
debug(message: string, context?: LogContext | unknown): void
info(message: string, context?: LogContext | unknown): void
warn(message: string, context?: LogContext | unknown): void
error(message: string, errorOrContext?: Error | unknown, context?: LogContext): void
fatal(message: string, errorOrContext?: Error | unknown, context?: LogContext): void
child(bindings: LogContext): CatbeeLogger
time(label: string): void
timeEnd(label: string): void
flush(): Promise<void>
```

### 2. Types (`logger.types.ts`)

**CatbeeLogLevel**: RFC 5424-compliant log levels
```typescript
enum CatbeeLogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
  OFF = 100
}
```

**LogEntry**: Core log entry structure
```typescript
interface LogEntry {
  level: CatbeeLogLevel;
  time: number;
  msg: string;
  name?: string;
  context?: LogContext;
  err?: SerializedError;
  [key: string]: unknown;
}
```

**LogTransport**: Transport interface
```typescript
interface LogTransport {
  readonly name: string;
  readonly level: CatbeeLogLevel;
  write(entry: LogEntry): void | Promise<void>;
  destroy?(): void | Promise<void>;
}
```

### 3. Transports

#### ConsoleTransport (`transports/console.transport.ts`)
- Browser-optimized with CSS styling
- Node.js-optimized with ANSI colors
- Pretty-print or JSON output
- IE11 fallback support

**Features:**
- Automatic platform detection
- Color-coded log levels
- Pretty formatting for development
- JSON formatting for production

#### HttpTransport (`transports/http.transport.ts`)
- Batch log entries for efficiency
- Automatic retry with exponential backoff
- Configurable flush intervals
- Timeout handling
- Error recovery

**Features:**
- Batching (default: 10 entries or 5 seconds)
- Retry logic (default: 3 attempts)
- Timeout protection (default: 10 seconds)
- Graceful degradation

### 4. Serializers (`serializers/index.ts`)

#### Error Serializer
Extracts structured error information:
```typescript
{
  type: string;
  message: string;
  stack?: string;
  code?: string | number;
  [key: string]: unknown;
}
```

#### Request Serializer
Serializes HTTP requests (Express, Angular HttpClient):
```typescript
{
  method?: string;
  url?: string;
  headers?: Record<string, string | string[]>;
  remoteAddress?: string;
  remotePort?: number;
}
```

#### Response Serializer
Serializes HTTP responses:
```typescript
{
  statusCode?: number;
  headers?: Record<string, string | string[]>;
}
```

#### Object Serializer
- Circular reference detection
- Configurable max depth
- Date serialization
- Array handling

#### Redaction Serializer
Automatically redacts sensitive fields:
- password, passwd
- secret, token
- apiKey, api_key
- accessToken, refreshToken
- creditCard, ssn, cvv, pin

## Configuration System

### Provider (`logger.config.ts`)

```typescript
provideCatbeeLogger(config?: CatbeeLoggerConfig): EnvironmentProviders
```

### Configuration Options

```typescript
interface CatbeeLoggerConfig {
  // Core settings
  level?: CatbeeLogLevel;
  name?: string;
  base?: LogContext;
  
  // Serialization
  serializers?: Record<string, Serializer>;
  maxDepth?: number;
  
  // Redaction
  redactSensitive?: boolean;
  redactPaths?: string[];
  
  // Transports
  transports?: LogTransport[];
  
  // Output formatting
  useColors?: boolean;
  prettyPrint?: boolean;
  
  // Metadata
  includeTimestamp?: boolean;
  includeHostname?: boolean;
  includePid?: boolean;
  
  // Performance
  batchSize?: number;
  flushInterval?: number;
  timestamp?: () => number;
}
```

## Data Flow

```
User Code
    ↓
Logger Method (trace/debug/info/warn/error/fatal)
    ↓
Level Check (early exit if below threshold)
    ↓
Create LogEntry
    ↓
Merge Base Context
    ↓
Serialize Context (with custom serializers)
    ↓
Extract Special Fields (err, req, res)
    ↓
Write to Transports (parallel, async)
    ↓
Console / HTTP / Custom Output
```

## Performance Optimizations

### 1. Early Level Checking
```typescript
if (level < this.config.level) {
  return; // Exit before any work
}
```

### 2. Lazy Serialization
Objects are only serialized when:
- Log level is enabled
- Transport accepts the log level
- Custom serializer exists for the field

### 3. Batching (HTTP Transport)
- Reduces HTTP requests
- Configurable batch size and flush interval
- Automatic flush on destroy

### 4. Async Transports
```typescript
const result = transport.write(entry);
if (result instanceof Promise) {
  result.catch(err => {
    console.error(`Transport failed:`, err);
  });
}
```

### 5. Circular Reference Handling
Uses `WeakSet` for O(1) circular detection:
```typescript
const seen = new WeakSet();
if (seen.has(value)) {
  return '[Circular]';
}
```

## Browser vs SSR Differences

### Browser
- Uses CSS styling (`%c` placeholders)
- Pretty-print by default
- No hostname/PID
- Performance API available

### Server (SSR/Node.js)
- Uses ANSI color codes
- Can include hostname/PID
- JSON output recommended
- Process information available

### Platform Detection
```typescript
const isBrowser = isPlatformBrowser(this.platformId);
```

## Security Features

### 1. Automatic Redaction
Sensitive fields are automatically replaced with `[REDACTED]`:
```typescript
this.logger.info('User data', {
  username: 'john',
  password: 'secret123' // Becomes [REDACTED]
});
```

### 2. Header Sanitization
HTTP headers like `Authorization`, `Cookie`, `X-API-Key` are redacted.

### 3. Custom Redaction Paths
```typescript
provideCatbeeLogger({
  redactSensitive: true,
  redactPaths: ['customSecret', 'privateKey']
})
```

### 4. Serializer Control
Custom serializers give full control over what gets logged:
```typescript
serializers: {
  user: (user) => ({
    id: user.id,
    // Omit sensitive fields
  })
}
```

## Child Logger System

### Context Inheritance
```typescript
const parent = inject(CatbeeLogger);
// Parent config: { level: INFO, name: 'App' }

const child = parent.child({ userId: 123 });
// Inherits: level, name, transports, serializers
// Adds: userId to every log entry
```

### Nested Children
```typescript
const parent = logger.child({ module: 'Auth' });
const child = parent.child({ userId: 123 });
// child logs include: module: 'Auth', userId: 123
```

### Shared Transports
Children share transports with parents for efficiency:
```typescript
childLogger.transports = this.transports; // Reference, not copy
```

## Error Handling

### Transport Errors
```typescript
try {
  transport.write(entry);
} catch (err) {
  console.error(`Transport "${transport.name}" error:`, err);
  // Continue to next transport
}
```

### Async Transport Errors
```typescript
result.catch(err => {
  console.error(`Transport "${transport.name}" failed:`, err);
  // Don't throw, log to console instead
});
```

### Serialization Errors
Handled gracefully with fallbacks:
- Circular references → `[Circular]`
- Max depth → `[Max Depth Reached]`
- Unknown types → String conversion

## Memory Management

### Timer Cleanup
```typescript
private readonly timers = new Map<string, number[]>();

timeEnd(label: string): void {
  const timers = this.timers.get(label);
  const startTime = timers.pop()!;
  if (timers.length === 0) {
    this.timers.delete(label); // Clean up
  }
}
```

### Transport Cleanup
```typescript
ngOnDestroy(): void {
  this.transports.forEach(transport => {
    transport.destroy?.();
  });
}
```

### Batch Cleanup (HTTP Transport)
```typescript
async destroy(): Promise<void> {
  clearInterval(this.timer);
  await this.flush(); // Send remaining logs
}
```

## TypeScript Strict Mode Compliance

All code follows strict TypeScript rules:
- No `any` types (except minimal, documented cases)
- Index signature access via bracket notation
- Proper type narrowing
- Null/undefined checks

## Testing Considerations

### Mockable Interface
```typescript
const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn(() => mockLogger),
  time: jest.fn(),
  timeEnd: jest.fn()
};
```

### Transport Testing
```typescript
const testTransport: LogTransport = {
  name: 'test',
  level: CatbeeLogLevel.TRACE,
  write: (entry) => {
    // Capture entries for assertions
  }
};
```

## Production Checklist

- [ ] Set appropriate log level (WARN or ERROR)
- [ ] Disable prettyPrint (use JSON)
- [ ] Configure HTTP transport for errors
- [ ] Enable sensitive data redaction
- [ ] Add base context (env, version, etc.)
- [ ] Test flush on application shutdown
- [ ] Monitor transport error handling
- [ ] Verify log aggregation pipeline

## Comparison with Other Loggers

### vs console.log
- ✅ Structured data
- ✅ Log levels
- ✅ Remote transport
- ✅ Production-ready

### vs NgxLogger
- ✅ Structured logging
- ✅ Multiple transports
- ✅ Better serialization
- ✅ Production focus

### vs Pino (Node.js)
- ✅ Similar API
- ✅ Structured logging
- ✅ Child loggers
- ⚠️ Angular-specific (browser + SSR)
- ⚠️ Fewer transports (can add custom)

## Future Enhancements

Potential additions:
1. WebSocket transport
2. IndexedDB transport (browser)
3. Log sampling/throttling
4. Structured error tracking
5. Performance marks integration
6. Source map support
7. Log rotation (SSR)
8. Compression (HTTP transport)

## License

MIT © Catbee Technologies
