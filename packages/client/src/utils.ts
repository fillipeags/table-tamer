/**
 * Promisify a callback-based adapter method.
 * WatermelonDB v0.28 adapter methods use (result, error) => void callbacks.
 */
export function promisifyAdapterMethod<T>(
  fn: (callback: (result: { value: T }) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      fn((result) => {
        resolve(result.value);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Sanitize a value for JSON serialization.
 * Replaces binary/blob data with a placeholder.
 */
export function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    // Detect likely binary data (non-printable chars)
    if (/[\x00-\x08\x0E-\x1F]/.test(value) && value.length > 100) {
      return `[BLOB: ${value.length} bytes]`;
    }
    return value;
  }
  return value;
}

/**
 * Sanitize an entire row object.
 */
export function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}
