import { CatbeeLogLevel, LogEntry, LogTransport } from '../logger.types';

/**
 * HTTP transport options.
 *
 * @public
 */
export interface HttpTransportOptions {
  /** Minimum log level */
  level?: CatbeeLogLevel;
  /** HTTP endpoint URL */
  url: string;
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT';
  /** Custom headers */
  headers?: Record<string, string>;
  /** Batch size before sending (default: 10) */
  batchSize?: number;
  /** Flush interval in milliseconds (default: 5000) */
  flushInterval?: number;
  /** Maximum retries on failure (default: 3) */
  maxRetries?: number;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * HTTP transport for sending logs to a remote endpoint.
 * Supports batching and retry logic for production reliability.
 *
 * @public
 */
export class HttpTransport implements LogTransport {
  readonly name = 'http';
  readonly level: CatbeeLogLevel;

  private readonly url: string;
  private readonly method: 'POST' | 'PUT';
  private readonly headers: Record<string, string>;
  private readonly batchSize: number;
  private readonly flushInterval: number;
  private readonly maxRetries: number;
  private readonly timeout: number;

  private batch: LogEntry[] = [];
  private timer?: ReturnType<typeof setTimeout>;

  constructor(options: HttpTransportOptions) {
    this.level = options.level ?? CatbeeLogLevel.INFO;
    this.url = options.url;
    this.method = options.method ?? 'POST';
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.batchSize = options.batchSize ?? 10;
    this.flushInterval = options.flushInterval ?? 5000;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 10000;

    // Start flush timer
    this.startFlushTimer();
  }

  async write(entry: LogEntry): Promise<void> {
    if (entry.level < this.level) {
      return;
    }

    this.batch.push(entry);

    // Flush immediately if batch is full
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Start the periodic flush timer.
   */
  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush().catch(err => {
          console.error('[HttpTransport] Flush failed:', err);
        });
      }
    }, this.flushInterval);
  }

  /**
   * Flush all batched logs to the HTTP endpoint.
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const entries = [...this.batch];
    this.batch = [];

    await this.sendWithRetry(entries, 0);
  }

  /**
   * Send logs with retry logic.
   */
  private async sendWithRetry(entries: LogEntry[], attempt: number): Promise<void> {
    try {
      await this.send(entries);
    } catch (error) {
      if (attempt < this.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(entries, attempt + 1);
      } else {
        console.error('[HttpTransport] Max retries reached, dropping logs:', error);
      }
    }
  }

  /**
   * Send logs to HTTP endpoint.
   */
  private async send(entries: LogEntry[]): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify({ logs: entries }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cleanup timer and flush remaining logs.
   */
  async destroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    await this.flush();
  }
}
