import { CookieBuilder } from './cookie-builder';

describe('CookieBuilder', () => {
  describe('create', () => {
    it('should create a builder with name and value', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(builder).toBeTruthy();
      expect(builder.build()).toBe('test=value');
    });

    it('should create a builder with name and default empty value', () => {
      const builder = CookieBuilder.create('test');
      expect(builder.build()).toBe('test=');
    });

    it('should throw error for empty name', () => {
      expect(() => CookieBuilder.create('')).toThrowError('Cookie name must be a non-empty string.');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => CookieBuilder.create('   ')).toThrowError('Cookie name must be a non-empty string.');
    });

    it('should accept custom encoding options', () => {
      const builder = CookieBuilder.create('test', 'hello world', {
        encodeName: name => name,
        encodeValue: value => value
      });
      expect(builder.build()).toBe('test=hello world');
    });
  });

  describe('withName', () => {
    it('should set cookie name', () => {
      const builder = CookieBuilder.create('initial', 'value').withName('updated');
      expect(builder.build()).toBe('updated=value');
    });

    it('should throw error for empty string', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withName('')).toThrowError('Cookie name must be a non-empty string.');
    });

    it('should throw error for whitespace-only string', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withName('  ')).toThrowError('Cookie name must be a non-empty string.');
    });

    it('should allow chaining', () => {
      const result = CookieBuilder.create('test').withName('session').withValue('abc123').build();
      expect(result).toBe('session=abc123');
    });
  });

  describe('withValue', () => {
    it('should set cookie value', () => {
      const builder = CookieBuilder.create('test', 'old').withValue('new');
      expect(builder.build()).toBe('test=new');
    });

    it('should handle empty string', () => {
      const builder = CookieBuilder.create('test', 'value').withValue('');
      expect(builder.build()).toBe('test=');
    });

    it('should handle null as empty string', () => {
      const builder = CookieBuilder.create('test', 'value').withValue(null as unknown as string);
      expect(builder.build()).toBe('test=');
    });

    it('should encode special characters by default', () => {
      const builder = CookieBuilder.create('test', 'hello world');
      expect(builder.build()).toBe('test=hello%20world');
    });
  });

  describe('withExpires', () => {
    it('should set expires with Date object', () => {
      const date = new Date('2025-12-31T23:59:59Z');
      const builder = CookieBuilder.create('test', 'value').withExpires(date);
      expect(builder.build()).toContain('Expires=Wed, 31 Dec 2025 23:59:59 GMT');
    });

    it('should set expires with milliseconds from now', () => {
      const builder = CookieBuilder.create('test', 'value').withExpires(3600000); // 1 hour
      const result = builder.build();
      expect(result).toContain('Expires=');
    });

    it('should throw error for invalid Date', () => {
      const invalidDate = new Date('invalid');
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withExpires(invalidDate)).toThrowError('Invalid Date object provided for expires.');
    });

    it('should throw error for non-finite number', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withExpires(Infinity)).toThrowError('Expires must be a finite number of milliseconds.');
    });

    it('should throw error for NaN', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withExpires(NaN)).toThrowError('Expires must be a finite number of milliseconds.');
    });
  });

  describe('withMaxAge', () => {
    it('should set max-age in seconds', () => {
      const builder = CookieBuilder.create('test', 'value').withMaxAge(3600);
      expect(builder.build()).toContain('Max-Age=3600');
    });

    it('should floor decimal values', () => {
      const builder = CookieBuilder.create('test', 'value').withMaxAge(3600.9);
      expect(builder.build()).toContain('Max-Age=3600');
    });

    it('should handle negative values as zero', () => {
      const builder = CookieBuilder.create('test', 'value').withMaxAge(-100);
      expect(builder.build()).toContain('Max-Age=0');
    });

    it('should throw error for non-finite number', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withMaxAge(Infinity)).toThrowError('Max-Age must be a finite number.');
    });

    it('should throw error for NaN', () => {
      const builder = CookieBuilder.create('test', 'value');
      expect(() => builder.withMaxAge(NaN)).toThrowError('Max-Age must be a finite number.');
    });
  });

  describe('withDomain', () => {
    it('should set domain attribute', () => {
      const builder = CookieBuilder.create('test', 'value').withDomain('example.com');
      expect(builder.build()).toContain('Domain=example.com');
    });

    it('should set subdomain', () => {
      const builder = CookieBuilder.create('test', 'value').withDomain('.example.com');
      expect(builder.build()).toContain('Domain=.example.com');
    });
  });

  describe('withPath', () => {
    it('should set path attribute', () => {
      const builder = CookieBuilder.create('test', 'value').withPath('/app');
      expect(builder.build()).toContain('Path=/app');
    });

    it('should set root path', () => {
      const builder = CookieBuilder.create('test', 'value').withPath('/');
      expect(builder.build()).toContain('Path=/');
    });
  });

  describe('withSecure', () => {
    it('should set secure flag by default', () => {
      const builder = CookieBuilder.create('test', 'value').withSecure();
      expect(builder.build()).toContain('Secure');
    });

    it('should set secure flag explicitly', () => {
      const builder = CookieBuilder.create('test', 'value').withSecure(true);
      expect(builder.build()).toContain('Secure');
    });

    it('should not set secure flag when false', () => {
      const builder = CookieBuilder.create('test', 'value').withSecure(false);
      expect(builder.build()).not.toContain('Secure');
    });
  });

  describe('withHttpOnly', () => {
    it('should set httpOnly flag by default', () => {
      const builder = CookieBuilder.create('test', 'value').withHttpOnly();
      expect(builder.build()).toContain('HttpOnly');
    });

    it('should set httpOnly flag explicitly', () => {
      const builder = CookieBuilder.create('test', 'value').withHttpOnly(true);
      expect(builder.build()).toContain('HttpOnly');
    });

    it('should not set httpOnly flag when false', () => {
      const builder = CookieBuilder.create('test', 'value').withHttpOnly(false);
      expect(builder.build()).not.toContain('HttpOnly');
    });
  });

  describe('withSameSite', () => {
    it('should set SameSite=Strict', () => {
      const builder = CookieBuilder.create('test', 'value').withSameSite('Strict');
      expect(builder.build()).toContain('SameSite=Strict');
    });

    it('should set SameSite=Lax', () => {
      const builder = CookieBuilder.create('test', 'value').withSameSite('Lax');
      expect(builder.build()).toContain('SameSite=Lax');
    });

    it('should set SameSite=None and auto-enable Secure', () => {
      const spy = spyOn(console, 'warn');
      const builder = CookieBuilder.create('test', 'value').withSameSite('None');
      const result = builder.build();
      expect(result).toContain('SameSite=None');
      expect(result).toContain('Secure');
      expect(spy).toHaveBeenCalledWith(
        'Cookie "test" with SameSite=None automatically enabled Secure (required by browsers).'
      );
    });

    it('should not warn if Secure already set when using SameSite=None', () => {
      const spy = spyOn(console, 'warn');
      const builder = CookieBuilder.create('test', 'value').withSecure().withSameSite('None');
      expect(builder.build()).toContain('SameSite=None');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('withPartitioned', () => {
    it('should set Partitioned flag by default', () => {
      const builder = CookieBuilder.create('test', 'value').withPartitioned();
      expect(builder.build()).toContain('Partitioned');
    });

    it('should set Partitioned flag explicitly', () => {
      const builder = CookieBuilder.create('test', 'value').withPartitioned(true);
      expect(builder.build()).toContain('Partitioned');
    });

    it('should not set Partitioned flag when false', () => {
      const builder = CookieBuilder.create('test', 'value').withPartitioned(false);
      expect(builder.build()).not.toContain('Partitioned');
    });
  });

  describe('withPriority', () => {
    it('should set Priority=Low', () => {
      const builder = CookieBuilder.create('test', 'value').withPriority('Low');
      expect(builder.build()).toContain('Priority=Low');
    });

    it('should set Priority=Medium', () => {
      const builder = CookieBuilder.create('test', 'value').withPriority('Medium');
      expect(builder.build()).toContain('Priority=Medium');
    });

    it('should set Priority=High', () => {
      const builder = CookieBuilder.create('test', 'value').withPriority('High');
      expect(builder.build()).toContain('Priority=High');
    });
  });

  describe('build', () => {
    it('should throw error if name is empty after withName', () => {
      const builder = CookieBuilder.create('test');
      expect(() => builder.withName('')).toThrowError('Cookie name must be a non-empty string.');
    });

    it('should build complete cookie with all attributes', () => {
      const date = new Date('2025-12-31T23:59:59Z');
      const builder = CookieBuilder.create('session', 'abc123')
        .withExpires(date)
        .withMaxAge(3600)
        .withDomain('example.com')
        .withPath('/')
        .withSecure()
        .withHttpOnly()
        .withSameSite('Strict')
        .withPartitioned()
        .withPriority('High');

      const result = builder.build();
      expect(result).toContain('session=abc123');
      expect(result).toContain('Expires=Wed, 31 Dec 2025 23:59:59 GMT');
      expect(result).toContain('Max-Age=3600');
      expect(result).toContain('Domain=example.com');
      expect(result).toContain('Path=/');
      expect(result).toContain('Secure');
      expect(result).toContain('HttpOnly');
      expect(result).toContain('SameSite=Strict');
      expect(result).toContain('Partitioned');
      expect(result).toContain('Priority=High');
    });

    it('should maintain consistent attribute order', () => {
      const builder = CookieBuilder.create('test', 'value')
        .withPriority('High')
        .withSecure()
        .withPath('/app')
        .withMaxAge(3600);

      const result = builder.build();
      const nameValueIndex = result.indexOf('test=value');
      const maxAgeIndex = result.indexOf('Max-Age=');
      const pathIndex = result.indexOf('Path=');
      const secureIndex = result.indexOf('Secure');
      const priorityIndex = result.indexOf('Priority=');

      // Verify order: name=value, Max-Age, Path, Secure, Priority
      expect(nameValueIndex).toBeLessThan(maxAgeIndex);
      expect(maxAgeIndex).toBeLessThan(pathIndex);
      expect(pathIndex).toBeLessThan(secureIndex);
      expect(secureIndex).toBeLessThan(priorityIndex);
    });
  });

  describe('toString', () => {
    it('should return same result as build()', () => {
      const builder = CookieBuilder.create('test', 'value').withPath('/').withSecure();
      expect(builder.toString()).toBe(builder.build());
    });

    it('should work with implicit string conversion', () => {
      const builder = CookieBuilder.create('test', 'value');
      const result = `Cookie: ${builder}`;
      expect(result).toBe('Cookie: test=value');
    });
  });

  describe('method chaining', () => {
    it('should support full method chaining', () => {
      const result = CookieBuilder.create('auth', 'token123')
        .withExpires(3600000)
        .withPath('/')
        .withDomain('example.com')
        .withSecure()
        .withHttpOnly()
        .withSameSite('Strict')
        .build();

      expect(result).toContain('auth=token123');
      expect(result).toContain('Path=/');
      expect(result).toContain('Domain=example.com');
      expect(result).toContain('Secure');
      expect(result).toContain('HttpOnly');
      expect(result).toContain('SameSite=Strict');
    });
  });

  describe('custom encoding', () => {
    it('should use custom name encoder', () => {
      const builder = CookieBuilder.create('test name', 'value', {
        encodeName: name => name.replace(' ', '_')
      });
      expect(builder.build()).toBe('test_name=value');
    });

    it('should use custom value encoder', () => {
      const builder = CookieBuilder.create('test', 'hello world', {
        encodeValue: value => value.replace(' ', '+')
      });
      expect(builder.build()).toBe('test=hello+world');
    });

    it('should use both custom encoders', () => {
      const builder = CookieBuilder.create('my cookie', 'my value', {
        encodeName: name => name.toUpperCase(),
        encodeValue: value => value.toUpperCase()
      });
      expect(builder.build()).toBe('MY COOKIE=MY VALUE');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in name and value', () => {
      const builder = CookieBuilder.create('test-key_123', 'value@#$%');
      const result = builder.build();
      expect(result).toContain('test-key_123=');
    });

    it('should handle unicode characters', () => {
      const builder = CookieBuilder.create('test', '你好世界');
      const result = builder.build();
      expect(result).toContain('test=');
      expect(result).toContain('%'); // encoded unicode
    });

    it('should handle zero max-age', () => {
      const builder = CookieBuilder.create('test', 'value').withMaxAge(0);
      expect(builder.build()).toContain('Max-Age=0');
    });

    it('should handle empty domain', () => {
      const builder = CookieBuilder.create('test', 'value').withDomain('');
      expect(builder.build()).not.toContain('Domain=');
    });

    it('should handle empty path', () => {
      const builder = CookieBuilder.create('test', 'value').withPath('');
      expect(builder.build()).not.toContain('Path=');
    });
  });

  describe('type safety', () => {
    it('should only accept valid SameSite values', () => {
      const builder = CookieBuilder.create('test', 'value');

      // TypeScript should only allow these values
      builder.withSameSite('Strict');
      builder.withSameSite('Lax');
      builder.withSameSite('None');

      // This would fail TypeScript compilation:
      // builder.withSameSite('Invalid' as CookieSameSite);
    });

    it('should only accept valid Priority values', () => {
      const builder = CookieBuilder.create('test', 'value');

      // TypeScript should only allow these values
      builder.withPriority('Low');
      builder.withPriority('Medium');
      builder.withPriority('High');

      // This would fail TypeScript compilation:
      // builder.withPriority('Invalid' as CookiePriority);
    });
  });
});
