# @ng-catbee/jwt

## Catbee JWT for Angular

> A modern, type-safe Angular library for decoding, validating, and managing JSON Web Tokens (JWT) in client-side applications — fully compatible with Server-Side Rendering (SSR) and offering comprehensive token utilities including expiration tracking, claim extraction, and reactive observables.

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
import { CatbeeJwtService, type JwtPayload } from '@ng-catbee/jwt';

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
  private jwtService = inject(CatbeeJwtService);
  private authService = inject(AuthService);
  user = signal<UserPayload | null>(null);
  private token = this.authService.getToken(); // Replace with your token retrieval logic

  ngOnInit() {
    if (this.token && !this.jwtService.isExpired(this.token)) {
      this.user.set(this.jwtService.decodePayload<UserPayload>(this.token));
    }
  }
}
```

## 📚 API Reference

| Method | Description |
|--------|-------------|
| `decodePayload<T>(token: string): T \| null` | Decode JWT payload with type safety |
| `decode<T>(token: string): DecodedJwt<T> \| null` | Decode complete JWT (header, payload, signature) |
| `isExpired(token: string, offsetSeconds?: number): boolean` | Check if token is expired |
| `isValidFormat(token: string): boolean` | Validate JWT format |
| `getExpirationDate(token: string): Date \| null` | Get expiration as Date object |
| `getIssuedDate(token: string): Date \| null` | Get issued-at as Date object |
| `getRemainingTime(token: string): number \| null` | Get remaining seconds until expiration |
| `watchExpiry(token: string, tickMs: number): Observable<number>` | Observe remaining time until expiration |
| `getClaim<T>(token: string, claim: string): T \| null` | Extract specific claim with type safety |
## 🎯 Common Use Cases

### Auth Guard

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CatbeeJwtService } from '@ng-catbee/jwt';
import { AuthService } from './auth.service';

export const authGuard = () => {
  const jwtService = inject(CatbeeJwtService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken(); // Replace with your token retrieval logic
  
  if (!token || !jwtService.isValidFormat(token) || jwtService.isExpired(token)) {
    return router.createUrlTree(['/login']);
  }
  
  return true;
};

function getAuthToken(): string | null {
  // Implement your secure token storage/retrieval here
  return null;
}
```

### HTTP Interceptor

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CatbeeJwtService } from '@ng-catbee/jwt';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(CatbeeJwtService);
  const authService = inject(AuthService);
  const token = authService.getToken(); // Replace with your token retrieval logic
  
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
import { CatbeeJwtService } from '@ng-catbee/jwt';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-token-countdown',
  template: `<p>Token expires in: {{ remainingSeconds() }}s</p>`
})
export class TokenCountdownComponent implements OnInit, OnDestroy {
  private jwtService = inject(CatbeeJwtService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private token = this.authService.getToken(); // Replace with your token retrieval logic
  public remainingSeconds = signal<number | null>(null);

  ngOnInit() {
    if (this.token) {
      this.jwtService.watchExpiry(this.token, 1000)
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
import { CatbeeJwtService } from '@ng-catbee/jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private jwtService = inject(CatbeeJwtService);
  private token: string | null = null; // Store token in service state

  setToken(token: string) {
    this.token = token;
  }

  hasRole(requiredRole: string): boolean {
    if (!this.token) return false;
    
    const role = this.jwtService.getClaim<string>(this.token, 'role');
    return role === requiredRole;
  }

  hasPermission(permission: string): boolean {
    if (!this.token) return false;
    
    const permissions = this.jwtService.getClaim<string[]>(this.token, 'permissions');
    return permissions?.includes(permission) ?? false;
  }
}
```

## 📖 Documentation

💡 Full documentation available at [https://catbee.in](https://catbee.in/docs/@ng-catbee/jwt/intro/)

- [Introduction](https://catbee.in/docs/@ng-catbee/jwt/intro/)
- [Installation](https://catbee.in/docs/@ng-catbee/jwt/installation/)
- [Usage](https://catbee.in/docs/@ng-catbee/jwt/usage/)
- [API Reference](https://catbee.in/docs/@ng-catbee/jwt/api-reference/)

## 📜 License

MIT © Catbee Technologies (see the [LICENSE](https://catbee.in/license/) file for the full text)

## 🔗 Links

- [JWT.io](https://jwt.io/) - Learn about JSON Web Tokens
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT Specification
- [Catbee Technologies](https://github.com/catbee-technologies)