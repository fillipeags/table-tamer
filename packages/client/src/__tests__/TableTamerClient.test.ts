import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock WebSocket before importing the module
class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState: number = 0;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.({});
  }

  simulateMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = 3;
    this.onclose?.({ code: 1000, reason: '', wasClean: true });
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as any).WebSocket = MockWebSocket;
  vi.useFakeTimers();
});

afterEach(() => {
  (globalThis as any).WebSocket = originalWebSocket;
  vi.useRealTimers();
});

// Need to dynamically import after setting up the mock
async function importModule() {
  vi.resetModules();
  return await import('../TableTamerClient');
}

describe('connectInspector / disconnectInspector', () => {
  function createMockDatabase(dbName = 'testdb', schemaVersion = 1) {
    return {
      schema: {
        version: schemaVersion,
        tables: { users: { columns: {} } },
      },
      adapter: { dbName },
      collections: {
        get: vi.fn().mockReturnValue({
          query: vi.fn().mockReturnValue({
            unsafeFetchRaw: vi.fn().mockResolvedValue([]),
          }),
        }),
      },
    } as any;
  }

  it('creates a WebSocket connection', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8765');

    disconnectInspector();
  });

  it('uses custom host and port', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database, host: '10.0.0.1', port: 9000 });

    expect(MockWebSocket.instances[0].url).toBe('ws://10.0.0.1:9000');

    disconnectInspector();
  });

  it('sends handshake on connection', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase('mydb', 3);

    connectInspector({
      database,
      appName: 'TestApp',
      appVersion: '2.0.0',
      platform: 'ios',
    });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    expect(ws.send).toHaveBeenCalledOnce();
    const sentMessage = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('handshake');
    expect(sentMessage.payload.appName).toBe('TestApp');
    expect(sentMessage.payload.appVersion).toBe('2.0.0');
    expect(sentMessage.payload.platform).toBe('ios');
    expect(sentMessage.payload.dbName).toBe('mydb');
    expect(sentMessage.payload.schemaVersion).toBe(3);

    disconnectInspector();
  });

  it('uses defaults for optional handshake fields', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    const sentMessage = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentMessage.payload.appName).toBe('React Native App');
    expect(sentMessage.payload.appVersion).toBe('0.0.0');
    expect(sentMessage.payload.platform).toBe('unknown');

    disconnectInspector();
  });

  it('disconnects previous client when connecting again', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });
    const firstWs = MockWebSocket.instances[0];

    connectInspector({ database });

    expect(firstWs.close).toHaveBeenCalled();
    expect(MockWebSocket.instances).toHaveLength(2);

    disconnectInspector();
  });

  it('disconnectInspector closes the connection', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });
    const ws = MockWebSocket.instances[0];

    disconnectInspector();

    expect(ws.close).toHaveBeenCalled();
  });

  it('disconnectInspector is safe to call when not connected', async () => {
    const { disconnectInspector } = await importModule();

    expect(() => disconnectInspector()).not.toThrow();
  });

  it('responds to request messages', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase('testdb', 2);

    connectInspector({ database, platform: 'android' });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    ws.send.mockClear();

    const requestMsg = {
      version: 1,
      id: 'req-1',
      timestamp: Date.now(),
      type: 'request',
      payload: { action: 'get_database_info' },
    };

    ws.simulateMessage(requestMsg);

    await vi.advanceTimersByTimeAsync(10);

    expect(ws.send).toHaveBeenCalledOnce();
    const response = JSON.parse(ws.send.mock.calls[0][0]);
    expect(response.type).toBe('response');
    expect(response.requestId).toBe('req-1');
    expect(response.payload.action).toBe('get_database_info');
    expect(response.payload.dbName).toBe('testdb');
    expect(response.payload.platform).toBe('android');

    disconnectInspector();
  });

  it('ignores non-request messages', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();
    ws.send.mockClear();

    ws.simulateMessage({
      version: 1,
      id: 'resp-1',
      timestamp: Date.now(),
      type: 'response',
      requestId: 'req-1',
      payload: { action: 'get_table_list', tables: [] },
    });

    await vi.advanceTimersByTimeAsync(10);

    expect(ws.send).not.toHaveBeenCalled();

    disconnectInspector();
  });

  it('handles onDisconnect callback', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // Simulate disconnect - should not throw
    expect(() => ws.simulateClose()).not.toThrow();

    disconnectInspector();
  });

  it('handles database with missing adapter dbName', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();
    (database.adapter as any).dbName = undefined;

    connectInspector({ database });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    const sentMessage = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentMessage.payload.dbName).toBe('unknown');

    disconnectInspector();
  });

  it('calls onConnect callback when connected', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();
    const onConnect = vi.fn();

    connectInspector({ database, onConnect });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    expect(onConnect).toHaveBeenCalledOnce();

    disconnectInspector();
  });

  it('calls onDisconnect callback when disconnected', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();
    const onDisconnect = vi.fn();

    connectInspector({ database, onDisconnect });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateClose();

    expect(onDisconnect).toHaveBeenCalledOnce();

    disconnectInspector();
  });

  it('blocks write operations in read-only mode', async () => {
    const { connectInspector, disconnectInspector } = await importModule();
    const database = createMockDatabase();

    connectInspector({ database, readOnly: true });

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();
    ws.send.mockClear();

    ws.simulateMessage({
      version: 1,
      id: 'req-1',
      timestamp: Date.now(),
      type: 'request',
      payload: { action: 'update_record', tableName: 'users', recordId: '1', column: 'name', value: 'test' },
    });

    await vi.advanceTimersByTimeAsync(10);

    expect(ws.send).toHaveBeenCalledOnce();
    const response = JSON.parse(ws.send.mock.calls[0][0]);
    expect(response.payload.error).toBe('Write operations are disabled in read-only mode');

    disconnectInspector();
  });
});
