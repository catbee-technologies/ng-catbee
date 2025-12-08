import type { Serializer, SerializedError, SerializedRequest, SerializedResponse } from '../logger.types';

/**
 * Default error serializer.
 * Extracts type, message, stack, and other properties from Error objects.
 *
 * @public
 */
export const errorSerializer: Serializer = (err: unknown): SerializedError | null => {
  if (!err) {
    return null;
  }

  if (!(err instanceof Error)) {
    return {
      type: 'UnknownError',
      message: String(err)
    };
  }

  const serialized: SerializedError = {
    type: err.constructor.name,
    message: err.message
  };

  if (err.stack) {
    serialized.stack = err.stack;
  }

  // Extract common error properties
  const errorObj = err as unknown as Record<string, unknown>;
  if (errorObj['code'] !== undefined) {
    serialized.code = errorObj['code'] as string | number;
  }

  // Copy additional enumerable properties
  for (const key of Object.keys(err)) {
    if (!['type', 'message', 'stack', 'code'].includes(key)) {
      serialized[key] = errorObj[key];
    }
  }

  return serialized;
};

/**
 * HTTP request serializer.
 * Works with various request object formats (Express, Angular HttpClient, etc.)
 *
 * @public
 */
export const requestSerializer: Serializer = (req: unknown): SerializedRequest | null => {
  if (!req || typeof req !== 'object') {
    return null;
  }

  const request = req as Record<string, unknown>;
  const serialized: SerializedRequest = {};

  // Extract method
  if (typeof request['method'] === 'string') {
    serialized.method = request['method'];
  }

  // Extract URL
  if (typeof request['url'] === 'string') {
    serialized.url = request['url'];
  } else if (request['originalUrl'] && typeof request['originalUrl'] === 'string') {
    serialized.url = request['originalUrl'];
  }

  // Extract headers
  if (request['headers'] && typeof request['headers'] === 'object') {
    serialized.headers = sanitizeHeaders(request['headers'] as Record<string, unknown>);
  }

  // Extract remote address (server-side)
  if (request['socket'] && typeof request['socket'] === 'object') {
    const socket = request['socket'] as Record<string, unknown>;
    if (typeof socket['remoteAddress'] === 'string') {
      serialized.remoteAddress = socket['remoteAddress'];
    }
    if (typeof socket['remotePort'] === 'number') {
      serialized.remotePort = socket['remotePort'];
    }
  }

  // Handle client IP from headers (for proxied requests)
  if (serialized.headers) {
    const xForwardedFor = serialized.headers['x-forwarded-for'];
    if (xForwardedFor && typeof xForwardedFor === 'string') {
      serialized.remoteAddress = xForwardedFor.split(',')[0].trim();
    }
  }

  return serialized;
};

/**
 * HTTP response serializer.
 *
 * @public
 */
export const responseSerializer: Serializer = (res: unknown): SerializedResponse | null => {
  if (!res || typeof res !== 'object') {
    return null;
  }

  const response = res as Record<string, unknown>;
  const serialized: SerializedResponse = {};

  // Extract status code
  if (typeof response['statusCode'] === 'number') {
    serialized.statusCode = response['statusCode'];
  } else if (typeof response['status'] === 'number') {
    serialized.statusCode = response['status'];
  }

  // Extract headers
  if (response['headers'] && typeof response['headers'] === 'object') {
    serialized.headers = sanitizeHeaders(response['headers'] as Record<string, unknown>);
  } else if (typeof response['getHeaders'] === 'function') {
    const headers = (response as { getHeaders: () => Record<string, unknown> })['getHeaders']();
    serialized.headers = sanitizeHeaders(headers);
  }

  return serialized;
};

/**
 * Sanitize headers by removing sensitive information.
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, string | string[]> {
  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveHeaders.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(String);
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

/**
 * Generic object serializer with circular reference handling.
 *
 * @public
 */
export function createObjectSerializer(maxDepth = 5): Serializer {
  return (obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    const seen = new WeakSet();

    function serialize(value: unknown, depth: number): unknown {
      if (depth > maxDepth) {
        return '[Max Depth Reached]';
      }

      if (value === null || value === undefined) {
        return value;
      }

      // Handle primitives
      if (typeof value !== 'object') {
        return value;
      }

      // Handle circular references
      if (seen.has(value as object)) {
        return '[Circular]';
      }

      seen.add(value as object);

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => serialize(item, depth + 1));
      }

      // Handle Date
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Handle Error (use error serializer)
      if (value instanceof Error) {
        return errorSerializer(value);
      }

      // Handle plain objects
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = serialize(val, depth + 1);
      }

      return result;
    }

    return serialize(obj, 0);
  };
}

/**
 * Redact sensitive data from objects.
 *
 * @public
 */
export function createRedactSerializer(paths: string[] = []): Serializer {
  const defaultPaths = [
    'password',
    'passwd',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'creditCard',
    'credit_card',
    'ssn',
    'cvv',
    'pin'
  ];

  const redactPaths = new Set([...defaultPaths, ...paths]);

  return (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    function redact(value: unknown): unknown {
      if (!value || typeof value !== 'object') {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map(redact);
      }

      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();

        if (redactPaths.has(key) || redactPaths.has(lowerKey)) {
          result[key] = '[REDACTED]';
        } else if (val && typeof val === 'object') {
          result[key] = redact(val);
        } else {
          result[key] = val;
        }
      }

      return result;
    }

    return redact(obj);
  };
}

/**
 * Default serializers for common use cases.
 *
 * @public
 */
export const defaultSerializers = {
  err: errorSerializer,
  error: errorSerializer,
  req: requestSerializer,
  request: requestSerializer,
  res: responseSerializer,
  response: responseSerializer
};
