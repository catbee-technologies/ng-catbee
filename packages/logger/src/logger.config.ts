import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { CatbeeLoggerConfig } from './logger.types';

/**
 * Injection token for Catbee Logger configuration.
 *
 * @public
 */
export const CATBEE_LOGGER_CONFIG = new InjectionToken<CatbeeLoggerConfig>('CATBEE_LOGGER_CONFIG');

/**
 * Provides global configuration for Catbee Logger.
 *
 * This is the recommended way to configure the logger for your entire application.
 * Configure log levels, transports, serializers, and more.
 *
 * @param config - Global configuration for the logger.
 * @returns Environment providers for the configuration.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * import { provideCatbeeLogger, CatbeeLogLevel } from '@ng-catbee/logger';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeLogger({
 *       level: CatbeeLogLevel.INFO,
 *       name: 'MyApp',
 *       prettyPrint: true,
 *       useColors: true
 *     })
 *   ]
 * };
 *
 * // Advanced configuration with transports
 * import { provideCatbeeLogger, CatbeeLogLevel, HttpTransport } from '@ng-catbee/logger';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeLogger({
 *       level: CatbeeLogLevel.DEBUG,
 *       name: 'MyApp',
 *       base: { env: 'production', version: '1.0.0' },
 *       transports: [
 *         new ConsoleTransport({ level: CatbeeLogLevel.DEBUG, prettyPrint: true }),
 *         new HttpTransport({
 *           level: CatbeeLogLevel.WARN,
 *           url: 'https://api.example.com/logs',
 *           batchSize: 50
 *         })
 *       ],
 *       redactSensitive: true,
 *       redactPaths: ['password', 'apiKey', 'creditCard']
 *     })
 *   ]
 * };
 *
 * // Server-side configuration (SSR)
 * export const serverConfig: ApplicationConfig = {
 *   providers: [
 *     provideCatbeeLogger({
 *       level: CatbeeLogLevel.INFO,
 *       name: 'MyApp-SSR',
 *       prettyPrint: false, // Use JSON in production
 *       includeHostname: true,
 *       includePid: true,
 *       base: { env: 'production', server: true }
 *     })
 *   ]
 * };
 * ```
 *
 * @public
 */
export function provideCatbeeLogger(config?: CatbeeLoggerConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CATBEE_LOGGER_CONFIG,
      useValue: config || {}
    }
  ]);
}
