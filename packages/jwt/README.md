# @ng-catbee/jwt

## Catbee JWT for Angular

> A modern, type-safe Angular library for decoding, validating, and managing JSON Web Tokens (JWT) in client-side applications — fully compatible with Server-Side Rendering (SSR).

<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/ci.yml/badge.svg?label=Build" alt="Build Status" />
  <img src="https://github.com/catbee-technologies/ng-catbee/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://codecov.io/github/catbee-technologies/ng-catbee/graph/badge.svg?token=1A3ZOKH80Q" alt="Coverage" />
  <img src="https://img.shields.io/npm/v/@ng-catbee/jwt" alt="NPM Version" />
  <img src="https://img.shields.io/npm/dt/@ng-catbee/jwt" alt="NPM Downloads" />
  <img src="https://img.shields.io/maintenance/yes/2025" alt="Maintenance" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=alert_status&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Quality Gate Status" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=security_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Security Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=catbee-technologies_ng-catbee&metric=sqale_rating&token=c4ee05a3fd22735559b3313d201e64d85df79d18" alt="Maintainability Rating" />
  <img src="https://img.shields.io/npm/l/@ng-catbee/jwt" alt="License" />
</div>

## 📦 Demo

[Stackblitz](https://stackblitz.com/edit/ng-catbee-jwt?file=src%2Fapp%2Fapp.component.ts)

## ✨ Features

- 🔓 **Token Decoding** - Decode JWT headers and payloads with TypeScript support
- ⏰ **Expiration Management** - Check expiration, get remaining time, watch in real-time
- 🎯 **Type-Safe Claims** - Extract specific claims with generic type support
- ✅ **Format Validation** - Validate JWT format before decoding
- 🔄 **Reactive Observables** - Watch token expiration with RxJS
- 🌐 **SSR Compatible** - Works seamlessly with server-side rendering
- 🚀 **Zero Dependencies** - Lightweight (except Angular and RxJS)

## ⚠️ Security Notice

**This library decodes JWTs but does NOT verify signatures.** Always verify JWT signatures on your backend server. Client-side decoding should only be used for reading non-sensitive metadata and UI logic.

## 🛠️ Installation

```bash
npm install @ng-catbee/jwt
```

## ⚡ Quick Start

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { JwtService, type JwtPayload } from '@ng-catbee/jwt';

interface UserPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user',
  template: `
    @if(user) {
      <div>
        <h2>{{ user.email }}</h2>
        <p>Role: {{ user.role }}</p>
      </div>
   }
  `
})
export class UserComponent implements OnInit {
  private jwtService = inject(JwtService);
  user = signal<UserPayload | null>(null);

  ngOnInit() {
    const token = localStorage.getItem('access_token');
    
    if (token && !this.jwtService.isExpired(token)) {
      this.user.set(this.jwtService.decodePayload<UserPayload>(token));
    }
  }
}
```

## 📚 API Reference

| Method | Description | Returns |
|--------|-------------|---------|
| `decodePayload<T>(token)` | Decode JWT payload with type safety | `T \| null` |
| `decode<T>(token)` | Decode complete JWT (header, payload, signature) | `DecodedJwt<T> \| null` |
| `isExpired(token, offsetSeconds?)` | Check if token is expired | `boolean` |
| `isValidFormat(token)` | Validate JWT format | `boolean` |
| `getExpirationDate(token)` | Get expiration as Date object | `Date \| null` |
| `getIssuedDate(token)` | Get issued-at as Date object | `Date \| null` |
| `getRemainingTime(token)` | Get remaining seconds until expiration | `number \| null` |
| `watchExpiry(token, tickMs?)` | Observe remaining time until expiration | `Observable<number>` |
| `getClaim<T>(token, claim)` | Extract specific claim with type safety | `T \| null` |

## 🎯 Common Use Cases

### Auth Guard

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { JwtService } from '@ng-catbee/jwt';

export const authGuard = () => {
  const jwtService = inject(JwtService);
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  
  if (!token || !jwtService.isValidFormat(token) || jwtService.isExpired(token)) {
    return router.createUrlTree(['/login']);
  }
  
  return true;
};
```

### HTTP Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from '@ng-catbee/jwt';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = localStorage.getItem('access_token');
  
  if (token && jwtService.isValidFormat(token) && !jwtService.isExpired(token)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next(req);
};
```

### Watch Token Expiration

```typescript
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { JwtService } from '@ng-catbee/jwt';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-token-countdown',
  template: `<p>Token expires in: {{ remainingSeconds() }}s</p>`
})
export class TokenCountdownComponent implements OnInit, OnDestroy {
  private jwtService = inject(JwtService);
  private destroy$ = new Subject<void>();
  public remainingSeconds = signal<number | null>(null);

  ngOnInit() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.jwtService.watchExpiry(token, 1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(remaining => this.remainingSeconds.set(remaining));
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Role-Based Access

```typescript
import { Injectable, inject } from '@angular/core';
import { JwtService } from '@ng-catbee/jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private jwtService = inject(JwtService);

  hasRole(requiredRole: string): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    const role = this.jwtService.getClaim<string>(token, 'role');
    return role === requiredRole;
  }

  hasPermission(permission: string): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    const permissions = this.jwtService.getClaim<string[]>(token, 'permissions');
    return permissions?.includes(permission) ?? false;
  }
}
```

## 📖 Documentation

Full documentation: [https://catbee.npm.hprasath.com/docs/@ng-catbee/jwt](https://catbee.npm.hprasath.com/docs/@ng-catbee/jwt/intro)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.npm.hprasath.com/license/) file for the full text)

## 🔗 Links

- [JWT.io](https://jwt.io/) - Learn about JSON Web Tokens
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT Specification
- [Catbee Technologies](https://github.com/catbee-technologies)