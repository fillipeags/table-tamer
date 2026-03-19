import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PORT,
  PROTOCOL_VERSION,
  MAX_ROWS_LIMIT,
  DEFAULT_PAGE_SIZE,
  RECONNECT_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
} from '../constants';

describe('constants', () => {
  it('DEFAULT_PORT is 8765', () => {
    expect(DEFAULT_PORT).toBe(8765);
  });

  it('PROTOCOL_VERSION is 1', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it('MAX_ROWS_LIMIT is 1000', () => {
    expect(MAX_ROWS_LIMIT).toBe(1000);
  });

  it('DEFAULT_PAGE_SIZE is 50', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('RECONNECT_INTERVAL_MS is 3000', () => {
    expect(RECONNECT_INTERVAL_MS).toBe(3000);
  });

  it('REQUEST_TIMEOUT_MS is 10000', () => {
    expect(REQUEST_TIMEOUT_MS).toBe(10000);
  });

  it('all constants are numbers', () => {
    const constants = [
      DEFAULT_PORT,
      PROTOCOL_VERSION,
      MAX_ROWS_LIMIT,
      DEFAULT_PAGE_SIZE,
      RECONNECT_INTERVAL_MS,
      REQUEST_TIMEOUT_MS,
    ];
    for (const c of constants) {
      expect(typeof c).toBe('number');
    }
  });
});
