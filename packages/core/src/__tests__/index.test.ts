import { describe, it, expect } from 'vitest';
import * as core from '../index';

describe('core index exports', () => {
  it('exports all constants', () => {
    expect(core.DEFAULT_PORT).toBeDefined();
    expect(core.PROTOCOL_VERSION).toBeDefined();
    expect(core.MAX_ROWS_LIMIT).toBeDefined();
    expect(core.DEFAULT_PAGE_SIZE).toBeDefined();
    expect(core.RECONNECT_INTERVAL_MS).toBeDefined();
    expect(core.REQUEST_TIMEOUT_MS).toBeDefined();
  });

  it('exports protocol factory functions', () => {
    expect(typeof core.createEnvelope).toBe('function');
    expect(typeof core.createRequest).toBe('function');
    expect(typeof core.createResponse).toBe('function');
    expect(typeof core.createHandshake).toBe('function');
  });

  it('exports isErrorResponse type guard', () => {
    expect(typeof core.isErrorResponse).toBe('function');
  });
});
