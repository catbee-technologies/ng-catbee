# @catbee/logger

> Production-ready logger for Angular applications with SSR support, structured logging, and multiple transports.

[![npm version](https://badge.fury.io/js/%40catbee%2Flogger.svg)](https://www.npmjs.com/package/@catbee/logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Production-Ready**: Optimized for high-performance logging in production environments  
🌐 **SSR Compatible**: Works seamlessly in both browser and server-side rendering  
📊 **Structured Logging**: JSON-structured logs with customizable metadata  
🚀 **Multiple Transports**: Console, HTTP, and custom transport support  
🔒 **Security**: Built-in sensitive data redaction  
🎯 **Type-Safe**: Full TypeScript support with comprehensive types  
👶 **Child Loggers**: Create scoped loggers with inherited context  
⚡ **Zero Dependencies**: Only requires Angular core  
🎨 **Pretty Printing**: Beautiful console output with colors  
📦 **Batching**: Efficient log batching for remote transports  

Inspired by [Pino](https://getpino.io/) for Node.js, `@catbee/logger` brings production-grade logging to Angular.

## Installation

```bash
npm install @catbee/logger
```

## Quick Start

### 1. Configure the Logger

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideCatbeeLogger, CatbeeLogLevel } from '@catbee/logger';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCatbeeLogger({
      level: CatbeeLogLevel.INFO,
      name: 'MyApp',
      prettyPrint: true,
      useColors: true
    })
  ]
};
```

### 2. Use the Logger

```typescript
import { Component, inject } from '@angular/core';
import { CatbeeLogger } from '@catbee/logger';

@Component({
  selector: 'app-root',
  template: `<h1>Welcome</h1>`
})
export class AppComponent {
  private readonly logger = inject(CatbeeLogger);

  ngOnInit() {
    this.logger.info('Application started');
    this.logger.debug('Debug info', { userId: 123 });
    this.logger.error('Something went wrong', new Error('Failed'));
  }
}
```

## License

MIT © Catbee Technologies
