import { describe, it, expect, afterEach } from 'vitest';
import {
  isErrorResponse,
  createEnvelope,
  createRequest,
  createResponse,
  createHandshake,
  type ResponsePayload,
  type RequestPayload,
  type HandshakePayload,
} from '../protocol';

describe('isErrorResponse', () => {
  it('returns true for error responses', () => {
    const payload: ResponsePayload = {
      action: 'get_table_list',
      error: 'Something went wrong',
    };
    expect(isErrorResponse(payload)).toBe(true);
  });

  it('returns false for success responses', () => {
    const payload: ResponsePayload = {
      action: 'get_table_list',
      tables: [],
    };
    expect(isErrorResponse(payload)).toBe(false);
  });

  it('returns false for database info response', () => {
    const payload: ResponsePayload = {
      action: 'get_database_info',
      dbName: 'test',
      schemaVersion: 1,
      tableCount: 5,
      platform: 'ios',
    };
    expect(isErrorResponse(payload)).toBe(false);
  });

  it('returns true for any response with an error field', () => {
    const payload: ResponsePayload = {
      action: 'execute_sql',
      error: 'SQL syntax error',
    };
    expect(isErrorResponse(payload)).toBe(true);
  });
});

describe('createEnvelope', () => {
  it('returns an object with version 1', () => {
    const envelope = createEnvelope();
    expect(envelope.version).toBe(1);
  });

  it('returns an object with a string id', () => {
    const envelope = createEnvelope();
    expect(typeof envelope.id).toBe('string');
    expect(envelope.id.length).toBeGreaterThan(0);
  });

  it('returns an object with a numeric timestamp', () => {
    const envelope = createEnvelope();
    expect(typeof envelope.timestamp).toBe('number');
    expect(envelope.timestamp).toBeGreaterThan(0);
  });

  it('generates unique ids on each call', () => {
    const a = createEnvelope();
    const b = createEnvelope();
    expect(a.id).not.toBe(b.id);
  });

  it('timestamp is close to Date.now()', () => {
    const before = Date.now();
    const envelope = createEnvelope();
    const after = Date.now();
    expect(envelope.timestamp).toBeGreaterThanOrEqual(before);
    expect(envelope.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('generateId fallback', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('uses fallback UUID when crypto.randomUUID is unavailable', () => {
    // Remove crypto.randomUUID to trigger fallback
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });

    const envelope = createEnvelope();
    // Should still produce a valid UUID-like string
    expect(envelope.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('uses fallback UUID when crypto is undefined', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const envelope = createEnvelope();
    expect(typeof envelope.id).toBe('string');
    expect(envelope.id.length).toBeGreaterThan(0);
  });
});

describe('createRequest', () => {
  it('creates a request message with correct type', () => {
    const payload: RequestPayload = { action: 'get_table_list' };
    const msg = createRequest(payload);
    expect(msg.type).toBe('request');
  });

  it('includes the provided payload', () => {
    const payload: RequestPayload = { action: 'get_database_info' };
    const msg = createRequest(payload);
    expect(msg.payload).toEqual(payload);
  });

  it('includes envelope fields', () => {
    const msg = createRequest({ action: 'get_table_list' });
    expect(msg.version).toBe(1);
    expect(typeof msg.id).toBe('string');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates request with get_table_data payload', () => {
    const payload: RequestPayload = {
      action: 'get_table_data',
      tableName: 'users',
      page: 1,
      pageSize: 50,
      orderBy: 'name',
      orderDir: 'ASC',
    };
    const msg = createRequest(payload);
    expect(msg.payload).toEqual(payload);
    expect(msg.type).toBe('request');
  });

  it('creates request with execute_sql payload', () => {
    const payload: RequestPayload = {
      action: 'execute_sql',
      sql: 'SELECT * FROM users',
      args: [1, 'test'],
    };
    const msg = createRequest(payload);
    expect(msg.payload).toEqual(payload);
  });

  it('creates request with update_record payload', () => {
    const payload: RequestPayload = {
      action: 'update_record',
      tableName: 'users',
      recordId: 'abc123',
      column: 'name',
      value: 'John',
    };
    const msg = createRequest(payload);
    expect(msg.payload).toEqual(payload);
  });

  it('creates request with delete_records payload', () => {
    const payload: RequestPayload = {
      action: 'delete_records',
      tableName: 'users',
      recordIds: ['id1', 'id2'],
    };
    const msg = createRequest(payload);
    expect(msg.payload).toEqual(payload);
  });
});

describe('createResponse', () => {
  it('creates a response message with correct type', () => {
    const payload: ResponsePayload = {
      action: 'get_table_list',
      tables: [],
    };
    const msg = createResponse('req-123', payload);
    expect(msg.type).toBe('response');
  });

  it('includes the requestId', () => {
    const msg = createResponse('req-456', {
      action: 'get_table_list',
      tables: [],
    });
    expect(msg.requestId).toBe('req-456');
  });

  it('includes the provided payload', () => {
    const payload: ResponsePayload = {
      action: 'get_database_info',
      dbName: 'mydb',
      schemaVersion: 3,
      tableCount: 10,
      platform: 'android',
    };
    const msg = createResponse('req-789', payload);
    expect(msg.payload).toEqual(payload);
  });

  it('includes envelope fields', () => {
    const msg = createResponse('req-1', {
      action: 'update_record',
      success: true,
    });
    expect(msg.version).toBe(1);
    expect(typeof msg.id).toBe('string');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates response with error payload', () => {
    const payload: ResponsePayload = {
      action: 'execute_sql',
      error: 'Invalid SQL',
    };
    const msg = createResponse('req-err', payload);
    expect(msg.payload).toEqual(payload);
    expect(isErrorResponse(msg.payload)).toBe(true);
  });
});

describe('createHandshake', () => {
  const samplePayload: HandshakePayload = {
    appName: 'TestApp',
    appVersion: '1.0.0',
    platform: 'ios',
    dbName: 'testdb',
    schemaVersion: 5,
  };

  it('creates a handshake message with correct type', () => {
    const msg = createHandshake(samplePayload);
    expect(msg.type).toBe('handshake');
  });

  it('includes the provided payload', () => {
    const msg = createHandshake(samplePayload);
    expect(msg.payload).toEqual(samplePayload);
  });

  it('includes envelope fields', () => {
    const msg = createHandshake(samplePayload);
    expect(msg.version).toBe(1);
    expect(typeof msg.id).toBe('string');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('preserves all handshake payload fields', () => {
    const msg = createHandshake(samplePayload);
    expect(msg.payload.appName).toBe('TestApp');
    expect(msg.payload.appVersion).toBe('1.0.0');
    expect(msg.payload.platform).toBe('ios');
    expect(msg.payload.dbName).toBe('testdb');
    expect(msg.payload.schemaVersion).toBe(5);
  });
});
