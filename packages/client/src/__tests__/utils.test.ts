import { describe, it, expect } from 'vitest';
import { sanitizeValue, sanitizeRow, promisifyAdapterMethod } from '../utils';

describe('sanitizeValue', () => {
  it('returns null as-is', () => {
    expect(sanitizeValue(null)).toBeNull();
  });

  it('returns undefined as-is', () => {
    expect(sanitizeValue(undefined)).toBeUndefined();
  });

  it('returns numbers as-is', () => {
    expect(sanitizeValue(42)).toBe(42);
    expect(sanitizeValue(0)).toBe(0);
    expect(sanitizeValue(-1.5)).toBe(-1.5);
  });

  it('returns booleans as-is', () => {
    expect(sanitizeValue(true)).toBe(true);
    expect(sanitizeValue(false)).toBe(false);
  });

  it('returns regular strings as-is', () => {
    expect(sanitizeValue('hello world')).toBe('hello world');
    expect(sanitizeValue('')).toBe('');
  });

  it('returns short strings with control chars as-is (under 100 chars)', () => {
    const short = '\x00short';
    expect(sanitizeValue(short)).toBe(short);
  });

  it('replaces long binary strings with blob placeholder', () => {
    // Create a string > 100 chars with non-printable characters
    const binaryData = '\x00'.repeat(101);
    const result = sanitizeValue(binaryData);
    expect(result).toBe('[BLOB: 101 bytes]');
  });

  it('replaces binary data with correct length in placeholder', () => {
    const binaryData = '\x01'.repeat(500);
    expect(sanitizeValue(binaryData)).toBe('[BLOB: 500 bytes]');
  });

  it('does not replace long strings without control chars', () => {
    const longString = 'a'.repeat(200);
    expect(sanitizeValue(longString)).toBe(longString);
  });

  it('detects various non-printable control characters', () => {
    // \x00-\x08 and \x0E-\x1F should be detected
    for (const char of ['\x00', '\x01', '\x05', '\x08', '\x0E', '\x0F', '\x1F']) {
      const data = char.repeat(101);
      expect(sanitizeValue(data)).toBe(`[BLOB: 101 bytes]`);
    }
  });

  it('does not flag tab, newline, carriage return as binary', () => {
    // \x09 (tab), \x0A (newline), \x0D (CR) are in range \x09-\x0D, not in the binary regex
    const text = '\t\n\r'.repeat(50);
    expect(sanitizeValue(text)).toBe(text);
  });

  it('returns objects as-is', () => {
    const obj = { key: 'value' };
    expect(sanitizeValue(obj)).toEqual(obj);
  });
});

describe('sanitizeRow', () => {
  it('sanitizes all values in a row', () => {
    const binaryData = '\x00'.repeat(150);
    const row = {
      id: 'abc123',
      name: 'John',
      age: 30,
      avatar: binaryData,
      deleted: null,
    };
    const result = sanitizeRow(row);
    expect(result.id).toBe('abc123');
    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
    expect(result.avatar).toBe('[BLOB: 150 bytes]');
    expect(result.deleted).toBeNull();
  });

  it('returns an empty object for an empty row', () => {
    expect(sanitizeRow({})).toEqual({});
  });

  it('preserves all keys', () => {
    const row = { a: 1, b: 'two', c: null };
    const result = sanitizeRow(row);
    expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
  });

  it('creates a new object (does not mutate input)', () => {
    const row = { id: '1', name: 'test' };
    const result = sanitizeRow(row);
    expect(result).not.toBe(row);
    expect(result).toEqual(row);
  });
});

describe('promisifyAdapterMethod', () => {
  it('resolves with the value from callback', async () => {
    const fn = (callback: (result: { value: string }) => void) => {
      callback({ value: 'hello' });
    };
    const result = await promisifyAdapterMethod(fn);
    expect(result).toBe('hello');
  });

  it('resolves with numeric values', async () => {
    const fn = (callback: (result: { value: number }) => void) => {
      callback({ value: 42 });
    };
    const result = await promisifyAdapterMethod(fn);
    expect(result).toBe(42);
  });

  it('resolves with array values', async () => {
    const fn = (callback: (result: { value: string[] }) => void) => {
      callback({ value: ['a', 'b', 'c'] });
    };
    const result = await promisifyAdapterMethod(fn);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('rejects when the function throws', async () => {
    const fn = () => {
      throw new Error('adapter error');
    };
    await expect(promisifyAdapterMethod(fn)).rejects.toThrow('adapter error');
  });

  it('resolves with null values', async () => {
    const fn = (callback: (result: { value: null }) => void) => {
      callback({ value: null });
    };
    const result = await promisifyAdapterMethod(fn);
    expect(result).toBeNull();
  });
});
