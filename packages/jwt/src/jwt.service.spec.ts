import { TestBed } from '@angular/core/testing';
import { JwtService, type JwtPayload } from './jwt.service';

const NOW = new Date('2010-01-01 12:00:00');

// Helper function to create custom token
function createCustomToken(payload: any, header = { alg: 'HS256', typ: 'JWT' }): string {
  const encodeBase64Url = (obj: any) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCodePoint(Number.parseInt(p1, 16));
      })
    );
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const headerEncoded = encodeBase64Url(header);
  const payloadEncoded = encodeBase64Url(payload);
  const signature = 'mock-signature';

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// Helper function to create a token with specific expiration
function createTokenWithExp(exp: number, includeIat = true): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: any = { sub: '1234567890', name: 'Test User', exp };

  if (includeIat) {
    payload.iat = Math.floor(NOW.getTime() / 1000);
  }

  return createCustomToken(payload, header);
}

describe('JwtService', () => {
  let service: JwtService;
  let consoleErrorSpy: jasmine.Spy;

  const FAKE_NOW_TIMESTAMP = Math.floor(NOW.getTime() / 1000); // 1262347200 (2010-01-01 12:00:00 UTC)

  const validToken = createTokenWithExp(FAKE_NOW_TIMESTAMP + 3600);
  const expiredToken = createTokenWithExp(FAKE_NOW_TIMESTAMP - 3600);
  const tokenWithCustomClaims = createCustomToken({
    sub: 'user123',
    name: 'Jane Smith',
    roles: ['admin', 'user'],
    userId: 'abc123',
    email: 'jane@example.com',
    iat: FAKE_NOW_TIMESTAMP,
    exp: FAKE_NOW_TIMESTAMP + 3600
  });
  const tokenWithoutExp = createCustomToken({ sub: 'noexpuser', name: 'No Exp' });
  const tokenWithUTF8 = createCustomToken({
    sub: 'utf8user',
    name: 'Jöhn Döé',
    iat: FAKE_NOW_TIMESTAMP,
    exp: FAKE_NOW_TIMESTAMP + 3600
  });

  beforeAll(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterAll(() => {
    jasmine.clock().uninstall();
    consoleErrorSpy.calls.reset();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JwtService]
    });
    service = TestBed.inject(JwtService);

    // Suppress console.error for tests
    consoleErrorSpy = spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('decodePayload', () => {
    it('should decode a valid JWT payload', () => {
      const payload = service.decodePayload(validToken);

      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('1234567890');
      expect(payload?.['name']).toBe('Test User');
      expect(payload?.iat).toBe(FAKE_NOW_TIMESTAMP);
    });

    it('should decode payload with custom claims', () => {
      interface CustomPayload extends JwtPayload {
        userId: string;
        roles: string[];
        email: string;
      }

      const payload = service.decodePayload<CustomPayload>(tokenWithCustomClaims);

      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe('abc123');
      expect(payload?.['roles']).toEqual(['admin', 'user']);
      expect(payload?.email).toBe('jane@example.com');
      expect(payload?.['name']).toBe('Jane Smith');
    });

    it('should handle UTF-8 characters in payload', () => {
      const payload = service.decodePayload(tokenWithUTF8);

      expect(payload).toBeTruthy();
      expect(payload?.['name']).toBe('Jöhn Döé');
    });

    it('should return null for invalid token format', () => {
      expect(service.decodePayload('invalid.token')).toBeNull();
      expect(service.decodePayload('not-a-jwt')).toBeNull();
      expect(service.decodePayload('part1.part2.part3.part4')).toBeNull();
    });

    it('should return null for empty or null tokens', () => {
      expect(service.decodePayload('')).toBeNull();
      expect(service.decodePayload(null as any)).toBeNull();
      expect(service.decodePayload(undefined as any)).toBeNull();
    });

    it('should return null for non-string tokens', () => {
      expect(service.decodePayload(123 as any)).toBeNull();
      expect(service.decodePayload({} as any)).toBeNull();
      expect(service.decodePayload([] as any)).toBeNull();
    });

    it('should handle malformed base64 payload gracefully', () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.not-valid-base64!@#.signature';
      expect(service.decodePayload(malformedToken)).toBeNull();
    });

    it('should handle invalid JSON in payload', () => {
      const invalidJsonToken = 'eyJhbGciOiJIUzI1NiJ9.aW52YWxpZGpzb24.signature';
      expect(service.decodePayload(invalidJsonToken)).toBeNull();
    });
  });

  describe('decode', () => {
    it('should decode complete JWT including header, payload, and signature', () => {
      const decoded = service.decode(validToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.header.alg).toBe('HS256');
      expect(decoded?.header.typ).toBe('JWT');
      expect(decoded?.payload.sub).toBe('1234567890');
      expect(decoded?.payload['name']).toBe('Test User');
      expect(decoded?.signature).toBeTruthy();
      expect(decoded?.raw).toBe(validToken);
    });

    it('should decode token with custom payload type', () => {
      interface CustomPayload extends JwtPayload {
        userId: string;
        roles: string[];
      }

      const decoded = service.decode<CustomPayload>(tokenWithCustomClaims);

      expect(decoded).toBeTruthy();
      expect(decoded?.payload.userId).toBe('abc123');
      expect(decoded?.payload.roles).toEqual(['admin', 'user']);
    });

    it('should return null for invalid tokens', () => {
      expect(service.decode('invalid')).toBeNull();
      expect(service.decode('')).toBeNull();
      expect(service.decode(null as any)).toBeNull();
    });

    it('should preserve the original token in raw property', () => {
      const decoded = service.decode(validToken);
      expect(decoded?.raw).toBe(validToken);
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expired token', () => {
      expect(service.isExpired(validToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      expect(service.isExpired(expiredToken)).toBe(true);
    });

    it('should check expiration with offset', () => {
      const currentTime = FAKE_NOW_TIMESTAMP;
      const tokenExpiresSoon = createTokenWithExp(currentTime + 100); // Expires in 100 seconds

      expect(service.isExpired(tokenExpiresSoon, 0)).toBe(false);
      expect(service.isExpired(tokenExpiresSoon, 50)).toBe(false);
      expect(service.isExpired(tokenExpiresSoon, 150)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      expect(service.isExpired(tokenWithoutExp)).toBe(true);
    });

    it('should accept decoded payload as input', () => {
      const payload = service.decodePayload(validToken);
      expect(service.isExpired(payload!)).toBe(false);

      const expiredPayload = service.decodePayload(expiredToken);
      expect(service.isExpired(expiredPayload!)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(service.isExpired('invalid')).toBe(true);
      expect(service.isExpired('')).toBe(true);
    });

    it('should handle negative offset', () => {
      const currentTime = FAKE_NOW_TIMESTAMP;
      const token = createTokenWithExp(currentTime + 100);

      expect(service.isExpired(token, -50)).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time in seconds for valid token', () => {
      const currentTime = FAKE_NOW_TIMESTAMP;
      const token = createTokenWithExp(currentTime + 300); // 5 minutes from now

      const remaining = service.getRemainingTime(token);

      expect(remaining).toBeGreaterThan(290);
      expect(remaining).toBeLessThanOrEqual(300);
    });

    it('should return 0 for expired token', () => {
      expect(service.getRemainingTime(expiredToken)).toBe(0);
    });

    it('should return null for token without exp claim', () => {
      expect(service.getRemainingTime(tokenWithoutExp)).toBeNull();
    });

    it('should accept decoded payload as input', () => {
      const currentTime = FAKE_NOW_TIMESTAMP;
      const token = createTokenWithExp(currentTime + 300);
      const payload = service.decodePayload(token);

      const remaining = service.getRemainingTime(payload!);

      expect(remaining).toBeGreaterThan(290);
      expect(remaining).toBeLessThanOrEqual(300);
    });

    it('should return null for invalid token', () => {
      expect(service.getRemainingTime('invalid')).toBeNull();
      expect(service.getRemainingTime('')).toBeNull();
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid JWT format', () => {
      expect(service.isValidFormat(validToken)).toBe(true);
      expect(service.isValidFormat(expiredToken)).toBe(true);
      expect(service.isValidFormat(tokenWithCustomClaims)).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(service.isValidFormat('invalid')).toBe(false);
      expect(service.isValidFormat('only.two')).toBe(false);
      expect(service.isValidFormat('one.two.three.four')).toBe(false);
      expect(service.isValidFormat('')).toBe(false);
      expect(service.isValidFormat('...')).toBe(false);
    });

    it('should return false for tokens with invalid base64url characters', () => {
      expect(service.isValidFormat('part1!.part2.part3')).toBe(false);
      expect(service.isValidFormat('part1.part2@.part3')).toBe(false);
      expect(service.isValidFormat('part1.part2.part3=')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(service.isValidFormat(null as any)).toBe(false);
      expect(service.isValidFormat(undefined as any)).toBe(false);
      expect(service.isValidFormat(123 as any)).toBe(false);
      expect(service.isValidFormat({} as any)).toBe(false);
    });

    it('should return false for empty parts', () => {
      expect(service.isValidFormat('.part2.part3')).toBe(false);
      expect(service.isValidFormat('part1..part3')).toBe(false);
      expect(service.isValidFormat('part1.part2.')).toBe(false);
    });
  });

  describe('getClaim', () => {
    it('should extract standard claims', () => {
      expect(service.getClaim<string>(validToken, 'sub')).toBe('1234567890');
      expect(service.getClaim<string>(validToken, 'name')).toBe('Test User');
      expect(service.getClaim<number>(validToken, 'iat')).toBe(FAKE_NOW_TIMESTAMP);
    });

    it('should extract custom claims', () => {
      expect(service.getClaim<string>(tokenWithCustomClaims, 'userId')).toBe('abc123');
      expect(service.getClaim<string[]>(tokenWithCustomClaims, 'roles')).toEqual(['admin', 'user']);
      expect(service.getClaim<string>(tokenWithCustomClaims, 'email')).toBe('jane@example.com');
    });

    it('should return null for non-existent claims', () => {
      expect(service.getClaim(validToken, 'nonExistent')).toBeNull();
      expect(service.getClaim(validToken, 'roles')).toBeNull();
    });

    it('should return null for invalid token', () => {
      expect(service.getClaim('invalid', 'sub')).toBeNull();
      expect(service.getClaim('', 'sub')).toBeNull();
    });

    it('should handle complex claim types', () => {
      const complexClaim = service.getClaim<string[]>(tokenWithCustomClaims, 'roles');
      expect(Array.isArray(complexClaim)).toBe(true);
      expect(complexClaim?.length).toBe(2);
    });
  });

  describe('getExpirationDate', () => {
    it('should return expiration date for valid token', () => {
      const date = service.getExpirationDate(validToken);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBeGreaterThan(NOW.getTime());
    });

    it('should return expiration date for expired token', () => {
      const date = service.getExpirationDate(expiredToken);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBeLessThan(NOW.getTime());
    });

    it('should return null for token without exp claim', () => {
      expect(service.getExpirationDate(tokenWithoutExp)).toBeNull();
    });

    it('should accept decoded payload as input', () => {
      const payload = service.decodePayload(validToken);
      const date = service.getExpirationDate(payload!);

      expect(date).toBeInstanceOf(Date);
    });

    it('should return null for invalid token', () => {
      expect(service.getExpirationDate('invalid')).toBeNull();
      expect(service.getExpirationDate('')).toBeNull();
    });

    it('should convert Unix timestamp to Date correctly', () => {
      const currentTime = FAKE_NOW_TIMESTAMP;
      const token = createTokenWithExp(currentTime + 1000);
      const date = service.getExpirationDate(token);

      expect(date).toBeInstanceOf(Date);
      expect(Math.floor(date!.getTime() / 1000)).toBe(currentTime + 1000);
    });
  });

  describe('getIssuedDate', () => {
    it('should return issued date for token with iat claim', () => {
      const date = service.getIssuedDate(validToken);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(FAKE_NOW_TIMESTAMP * 1000);
    });

    it('should return null for token without iat claim', () => {
      const tokenWithoutIat = createTokenWithExp(9999999999, false);
      expect(service.getIssuedDate(tokenWithoutIat)).toBeNull();
    });

    it('should accept decoded payload as input', () => {
      const payload = service.decodePayload(validToken);
      const date = service.getIssuedDate(payload!);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getTime()).toBe(FAKE_NOW_TIMESTAMP * 1000);
    });

    it('should return null for invalid token', () => {
      expect(service.getIssuedDate('invalid')).toBeNull();
      expect(service.getIssuedDate('')).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle tokens with special characters in claims', () => {
      const payload = service.decodePayload(tokenWithUTF8);
      expect(payload).toBeTruthy();
      expect(payload?.['name']).toContain('ö');
    });

    it('should handle very long tokens', () => {
      const longPayload = {
        sub: '1234567890',
        data: 'x'.repeat(10000),
        exp: 9999999999
      };
      const longToken = createCustomToken(longPayload);
      const decoded = service.decodePayload(longToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.['data']).toBe('x'.repeat(10000));
    });

    it('should handle tokens with null values in claims', () => {
      const payload = { sub: '123', nullValue: null, exp: 9999999999 };
      const token = createCustomToken(payload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['nullValue']).toBeNull();
    });

    it('should handle tokens with array claims', () => {
      const payload = service.decodePayload(tokenWithCustomClaims);
      expect(Array.isArray(payload?.['roles'])).toBe(true);
      expect(payload?.['roles']).toEqual(['admin', 'user']);
    });

    it('should handle tokens with nested object claims', () => {
      const nestedPayload = {
        sub: '123',
        user: {
          name: 'John',
          profile: {
            age: 30,
            city: 'NYC'
          }
        },
        exp: 9999999999
      };
      const token = createCustomToken(nestedPayload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['user'].name).toBe('John');
      expect(decoded?.['user'].profile.age).toBe(30);
    });

    it('should handle concurrent decode operations', () => {
      const tokens = [validToken, expiredToken, tokenWithCustomClaims];
      const results = tokens.map(token => service.decodePayload(token));

      expect(results.every(r => r !== null)).toBe(true);
      expect(results[0]?.['name']).toBe('Test User');
      expect(results[2]?.['name']).toBe('Jane Smith');
    });
  });

  describe('base64UrlDecode edge cases', () => {
    it('should handle tokens with different base64url padding scenarios', () => {
      // Test various padding scenarios by creating tokens with different payload lengths
      const shortPayload = { a: '1' };
      const mediumPayload = { abc: '123' };
      const longPayload = { abcdef: '123456' };

      const token1 = createCustomToken(shortPayload);
      const token2 = createCustomToken(mediumPayload);
      const token3 = createCustomToken(longPayload);

      expect(service.decodePayload(token1)).toBeTruthy();
      expect(service.decodePayload(token2)).toBeTruthy();
      expect(service.decodePayload(token3)).toBeTruthy();
    });

    it('should handle tokens with special characters that need URI encoding', () => {
      const payloadWithSpecialChars = {
        name: 'User "Name" with\'quotes',
        description: 'Text with <tags> & symbols',
        emoji: '🚀',
        unicode: '你好世界'
      };

      const token = createCustomToken(payloadWithSpecialChars);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['name']).toContain('quotes');
      expect(decoded?.['emoji']).toBe('🚀');
      expect(decoded?.['unicode']).toBe('你好世界');
    });

    it('should handle error when base64url has invalid padding (length % 4 === 1)', () => {
      // Create token with payload that will result in pad === 1 after base64url conversion
      const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.A.signature'; // Single char 'A' will have length 1, pad = 1

      const result = service.decodePayload(malformedToken);
      // Should return null due to error in base64UrlDecode
      expect(result).toBeNull();
    });

    it('should handle tokens with non-UTF8 bytes gracefully', () => {
      // Token with binary data that might fail UTF-8 decoding
      // This tests the catch block in isPlatformBrowser branch
      const token = createCustomToken({ data: 'test\x00\x01\x02' });
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
    });

    it('should decode tokens with various character encodings', () => {
      const payloads = [
        { text: 'ASCII text' },
        { text: 'Européen' },
        { text: 'Русский' },
        { text: '日本語' },
        { text: '한국어' },
        { text: 'العربية' }
      ];

      payloads.forEach(payload => {
        const token = createCustomToken(payload);
        const decoded = service.decodePayload(token);
        expect(decoded).toBeTruthy();
        expect(decoded?.['text']).toBe(payload.text);
      });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle getExpirationDate with null payload gracefully', () => {
      const result = service.getExpirationDate(null as any);
      expect(result).toBeNull();
    });

    it('should handle getExpirationDate with payload without exp', () => {
      const payload: JwtPayload = { sub: '123' };
      const result = service.getExpirationDate(payload);
      expect(result).toBeNull();
    });

    it('should handle getExpirationDate with object that causes error', () => {
      // Create object with getter that throws
      const badPayload = {
        get exp() {
          throw new Error('Test error');
        }
      };
      const result = service.getExpirationDate(badPayload as any);
      expect(result).toBeNull();
    });

    it('should handle getIssuedDate with object that causes error', () => {
      // Create object with getter that throws
      const badPayload = {
        get iat() {
          throw new Error('Test error');
        }
      };
      const result = service.getIssuedDate(badPayload as any);
      expect(result).toBeNull();
    });

    it('should handle getRemainingTime with object that causes error', () => {
      // Create object with getter that throws
      const badPayload = {
        get exp() {
          throw new Error('Test error');
        }
      };
      const result = service.getRemainingTime(badPayload as any);
      expect(result).toBeNull();
    });

    it('should handle isExpired with object that causes error', () => {
      // Create object with getter that throws
      const badPayload = {
        get exp() {
          throw new Error('Test error');
        }
      };
      const result = service.isExpired(badPayload as any);
      expect(result).toBe(true);
    });

    it('should handle getIssuedDate with null payload gracefully', () => {
      const result = service.getIssuedDate(null as any);
      expect(result).toBeNull();
    });

    it('should handle getIssuedDate with payload without iat', () => {
      const payload: JwtPayload = { sub: '123' };
      const result = service.getIssuedDate(payload);
      expect(result).toBeNull();
    });

    it('should handle getExpirationDate with invalid exp value', () => {
      const payload: JwtPayload = { sub: '123', exp: Number.NaN };
      const result = service.getExpirationDate(payload);
      // NaN is falsy, so should return null
      expect(result).toBeNull();
    });

    it('should handle getIssuedDate with invalid iat value', () => {
      const payload: JwtPayload = { sub: '123', iat: Number.NaN };
      const result = service.getIssuedDate(payload);
      // NaN is falsy, so should return null
      expect(result).toBeNull();
    });

    it('should handle getRemainingTime with null payload', () => {
      const result = service.getRemainingTime(null as any);
      expect(result).toBeNull();
    });

    it('should handle getRemainingTime with invalid exp value', () => {
      const payload: JwtPayload = { sub: '123', exp: Infinity };
      const result = service.getRemainingTime(payload);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle isExpired with invalid payload structure', () => {
      const result = service.isExpired({ invalid: true } as any);
      expect(result).toBe(true);
    });

    it('should handle isExpired with null payload', () => {
      const result = service.isExpired(null as any);
      expect(result).toBe(true);
    });

    it('should handle decode with malformed header JSON', () => {
      // Token where header part has invalid JSON (though hard to create without breaking base64)
      const token = 'invalid-header-json.eyJzdWIiOiIxMjMifQ.signature';
      const result = service.decode(token);
      expect(result).toBeNull();
    });

    it('should handle decode with empty parts', () => {
      const token = '..';
      const result = service.decode(token);
      expect(result).toBeNull();
    });
  });

  describe('platform-specific behavior', () => {
    it('should handle base64url characters (- and _) in tokens', () => {
      // Create payload that will generate - and _ in base64url encoding
      const payload = {
        data: '>>>???', // These characters often produce + and / in base64, which become - and _ in base64url
        text: 'test~~~'
      };

      const token = createCustomToken(payload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['data']).toBe('>>>???');
    });

    it('should handle very long payloads', () => {
      const largePayload = {
        data: 'x'.repeat(10000),
        array: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };

      const token = createCustomToken(largePayload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['data'].length).toBe(10000);
      expect(decoded?.['array'].length).toBe(100);
    });

    it('should handle payload with all standard JWT claims', () => {
      const fullPayload: JwtPayload = {
        iss: 'https://issuer.example.com',
        sub: 'user123',
        aud: ['app1', 'app2'],
        exp: 9999999999,
        nbf: FAKE_NOW_TIMESTAMP,
        iat: FAKE_NOW_TIMESTAMP,
        jti: 'unique-jwt-id-12345'
      };

      const token = createCustomToken(fullPayload);
      const decoded = service.decodePayload<JwtPayload>(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.iss).toBe('https://issuer.example.com');
      expect(decoded?.sub).toBe('user123');
      expect(decoded?.aud).toEqual(['app1', 'app2']);
      expect(decoded?.exp).toBe(9999999999);
      expect(decoded?.nbf).toBe(FAKE_NOW_TIMESTAMP);
      expect(decoded?.iat).toBe(FAKE_NOW_TIMESTAMP);
      expect(decoded?.jti).toBe('unique-jwt-id-12345');
    });

    it('should handle audience as string', () => {
      const payload: JwtPayload = {
        sub: '123',
        aud: 'single-audience'
      };

      const token = createCustomToken(payload);
      const decoded = service.decodePayload<JwtPayload>(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.aud).toBe('single-audience');
    });

    it('should handle tokens with numeric claims', () => {
      const payload = {
        userId: 123456,
        balance: 999.99,
        count: 0,
        negative: -42
      };

      const token = createCustomToken(payload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['userId']).toBe(123456);
      expect(decoded?.['balance']).toBe(999.99);
      expect(decoded?.['count']).toBe(0);
      expect(decoded?.['negative']).toBe(-42);
    });

    it('should handle tokens with boolean claims', () => {
      const payload = {
        isActive: true,
        isAdmin: false,
        hasAccess: true
      };

      const token = createCustomToken(payload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['isActive']).toBe(true);
      expect(decoded?.['isAdmin']).toBe(false);
      expect(decoded?.['hasAccess']).toBe(true);
    });

    it('should handle tokens with null and undefined values', () => {
      const payload = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0
      };

      const token = createCustomToken(payload);
      const decoded = service.decodePayload(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.['nullValue']).toBeNull();
      // undefined gets removed during JSON.stringify
      expect(decoded?.['emptyString']).toBe('');
      expect(decoded?.['zero']).toBe(0);
    });
  });
});

describe('JwtService - watchExpiry (with real timers)', () => {
  let service: JwtService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JwtService]
    });
    service = TestBed.inject(JwtService);
  });

  it('should emit remaining time until expiration', done => {
    const currentTime = Math.floor(Date.now() / 1000);
    const token = createTokenWithExp(currentTime + 3); // Expires in 3 seconds

    const emissions: (number | null)[] = [];

    service.watchExpiry(token, 500).subscribe({
      next: remaining => {
        emissions.push(remaining);
      },
      complete: () => {
        expect(emissions.length).toBeGreaterThan(0);
        expect(emissions[0]).toBeGreaterThan(0);

        // Verify emissions are decreasing
        for (let i = 1; i < emissions.length; i++) {
          expect(emissions[i]! <= emissions[i - 1]!).toBe(true);
        }

        done();
      }
    });
  });

  it('should complete when token expires', done => {
    const currentTime = Math.floor(Date.now() / 1000);
    const token = createTokenWithExp(currentTime + 2);

    let completed = false;

    service.watchExpiry(token, 500).subscribe({
      complete: () => {
        completed = true;
        expect(completed).toBe(true);
        done();
      }
    });
  });

  it('should emit distinct values only', done => {
    const currentTime = Math.floor(Date.now() / 1000);
    const token = createTokenWithExp(currentTime + 3);

    const emissions: (number | null)[] = [];

    service.watchExpiry(token, 100).subscribe({
      next: remaining => {
        emissions.push(remaining);
      },
      complete: () => {
        // Should have at least 2 emissions
        expect(emissions.length).toBeGreaterThan(1);
        // Check that consecutive emissions are different
        for (let i = 1; i < emissions.length; i++) {
          expect(emissions[i]).not.toBe(emissions[i - 1]);
        }
        done();
      }
    });
  });

  it('should handle custom tick interval', done => {
    const currentTime = Math.floor(Date.now() / 1000);
    const token = createTokenWithExp(currentTime + 2);

    const startTime = Date.now();
    let emissionCount = 0;

    service.watchExpiry(token, 200).subscribe({
      next: () => {
        emissionCount++;
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        // Should have multiple emissions with 200ms intervals
        expect(emissionCount).toBeGreaterThanOrEqual(1);
        expect(elapsed).toBeGreaterThanOrEqual(200);
        done();
      }
    });
  });
});
