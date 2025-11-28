/**
 * Configuration options for the MeasurePerformance decorator.
 */
export interface MeasurePerformanceOptions {
  /** Custom label for the performance mark */
  label?: string;
  /** Whether to log to console (default: true) */
  logToConsole?: boolean;
  /** Custom callback with performance data */
  callback?: (duration: number, methodName: string) => void;
  /** Warning threshold in milliseconds */
  warnThreshold?: number;
}

/**
 * Measures and logs the execution time of a method using the Performance API.
 *
 * This decorator uses the browser's Performance API to accurately measure method
 * execution time and optionally trigger warnings for slow operations.
 *
 * @param options - Configuration options for performance measurement.
 * @returns Method decorator that measures execution time.
 *
 * @example
 * ```typescript
 * class DataProcessor {
 *   @MeasurePerformance({ warnThreshold: 100 })
 *   processLargeDataset(data: Data[]): ProcessedData[] {
 *     return data.map(item => this.transform(item));
 *   }
 *
 *   @MeasurePerformance({
 *     label: 'API Call',
 *     callback: (duration, name) => analytics.track(name, duration)
 *   })
 *   async fetchData(): Promise<Data> {
 *     return await this.http.get('/api/data').toPromise();
 *   }
 * }
 * ```
 *
 * @public
 */
export function MeasurePerformance(options?: MeasurePerformanceOptions): MethodDecorator {
  const config = {
    logToConsole: options?.logToConsole ?? true,
    warnThreshold: options?.warnThreshold,
    callback: options?.callback,
    label: options?.label
  };

  return function (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const label = config.label || methodName;
      const startMark = `${label}-start`;
      const endMark = `${label}-end`;
      const measureName = `${label}-measure`;

      // Start performance measurement
      if (typeof performance !== 'undefined') {
        performance.mark(startMark);
      }

      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        // End performance measurement
        const duration = Date.now() - startTime;

        if (typeof performance !== 'undefined') {
          performance.mark(endMark);
          performance.measure(measureName, startMark, endMark);

          // Clean up marks
          performance.clearMarks(startMark);
          performance.clearMarks(endMark);
          performance.clearMeasures(measureName);
        }

        // Log to console
        if (config.logToConsole) {
          const message = `⏱️ ${label} executed in ${duration.toFixed(2)}ms`;

          if (config.warnThreshold && duration > config.warnThreshold) {
            console.warn(message);
          } else {
            console.log(message);
          }
        }

        // Invoke callback
        if (config.callback) {
          config.callback(duration, methodName);
        }

        return result;
      } catch (error) {
        // Clean up marks on error
        if (typeof performance !== 'undefined') {
          performance.clearMarks(startMark);
          performance.clearMarks(endMark);
        }
        throw error;
      }
    };

    return descriptor;
  };
}
