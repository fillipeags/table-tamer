import { describe, it, expect } from 'vitest';
import { extractHostFromUrl } from '../getDevServerHost';

describe('extractHostFromUrl', () => {
  it('extracts IP from Metro bundler URL', () => {
    expect(extractHostFromUrl('http://192.168.1.100:8081/index.bundle?platform=ios&dev=true'))
      .toBe('192.168.1.100');
  });

  it('extracts IP from URL without query params', () => {
    expect(extractHostFromUrl('http://10.0.0.5:8081/index.bundle'))
      .toBe('10.0.0.5');
  });

  it('extracts localhost from URL', () => {
    expect(extractHostFromUrl('http://localhost:8081/index.bundle?platform=android'))
      .toBe('localhost');
  });

  it('extracts 127.0.0.1 from URL', () => {
    expect(extractHostFromUrl('http://127.0.0.1:8081/index.bundle'))
      .toBe('127.0.0.1');
  });

  it('returns null for undefined', () => {
    expect(extractHostFromUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractHostFromUrl('')).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(extractHostFromUrl('not-a-url')).toBeNull();
  });

  it('handles URL with port only (no path)', () => {
    expect(extractHostFromUrl('http://192.168.0.162:8081'))
      .toBe('192.168.0.162');
  });
});
