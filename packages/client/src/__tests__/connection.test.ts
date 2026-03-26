import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connection } from '../connection';

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];
  static shouldThrow = false;

  url: string;
  readyState: number = 0;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    if (MockWebSocket.shouldThrow) {
      throw new Error('WebSocket constructor failed');
    }
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.({});
  }

  simulateMessage(data: any) {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = 3;
    this.onclose?.({ code, reason, wasClean: true });
  }

  simulateError(message = 'connection failed') {
    this.onerror?.({ message });
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  MockWebSocket.shouldThrow = false;
  (globalThis as any).WebSocket = MockWebSocket;
  vi.useFakeTimers();
});

afterEach(() => {
  (globalThis as any).WebSocket = originalWebSocket;
  vi.useRealTimers();
});

describe('Connection', () => {
  it('creates WebSocket with correct URL', () => {
    const connection = new Connection({
      host: '192.168.1.1',
      port: 9999,
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://192.168.1.1:9999');
  });

  it('uses default host and port', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8765');
  });

  it('calls onConnect when WebSocket opens', () => {
    const onConnect = vi.fn();
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect,
      onDisconnect: vi.fn(),
    });

    connection.connect();
    MockWebSocket.instances[0].simulateOpen();

    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('calls onDisconnect when WebSocket closes', () => {
    const onDisconnect = vi.fn();
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect,
    });

    connection.connect();
    MockWebSocket.instances[0].simulateClose();

    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('calls onMessage with parsed JSON on message', () => {
    const onMessage = vi.fn();
    const connection = new Connection({
      onMessage,
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    const msg = { type: 'request', payload: { action: 'get_table_list' } };
    MockWebSocket.instances[0].simulateMessage(msg);

    expect(onMessage).toHaveBeenCalledWith(msg);
  });

  it('does not crash on invalid JSON messages', () => {
    const onMessage = vi.fn();
    const connection = new Connection({
      onMessage,
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    MockWebSocket.instances[0].onmessage?.({ data: 'invalid json{{{' });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('sends JSON stringified messages when connected', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    const ws = MockWebSocket.instances[0];
    ws.readyState = 1;

    const message = { version: 1, id: 'test', timestamp: 123, type: 'handshake', payload: {} } as any;
    connection.send(message);

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('does not send when WebSocket is not open', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    const ws = MockWebSocket.instances[0];
    ws.readyState = 0;

    connection.send({ version: 1, id: 'test', timestamp: 123, type: 'handshake', payload: {} } as any);

    expect(ws.send).not.toHaveBeenCalled();
  });

  it('schedules reconnect after close', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    expect(MockWebSocket.instances).toHaveLength(1);

    // Simulate a successful connection first, then close
    MockWebSocket.instances[0].simulateOpen();
    MockWebSocket.instances[0].simulateClose();
    // First retry uses base interval (3000ms)
    vi.advanceTimersByTime(3000);

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('uses exponential backoff for reconnection', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    MockWebSocket.instances[0].simulateClose();

    // First retry at 3s
    vi.advanceTimersByTime(3000);
    expect(MockWebSocket.instances).toHaveLength(2);

    MockWebSocket.instances[1].simulateClose();

    // Second retry at 6s (3000 * 2^1)
    vi.advanceTimersByTime(5999);
    expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it('caps reconnect interval at 30 seconds', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    // Simulate many failures to push backoff past the cap
    for (let i = 0; i < 10; i++) {
      MockWebSocket.instances[MockWebSocket.instances.length - 1].simulateClose();
      vi.advanceTimersByTime(30_000);
    }

    const instancesBefore = MockWebSocket.instances.length;
    MockWebSocket.instances[MockWebSocket.instances.length - 1].simulateClose();

    // Should reconnect within 30s max
    vi.advanceTimersByTime(30_000);
    expect(MockWebSocket.instances.length).toBe(instancesBefore + 1);
  });

  it('resets retry count after successful connection', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    // Fail a few times to build up retryCount
    MockWebSocket.instances[0].simulateClose();
    vi.advanceTimersByTime(3000); // retry 1
    MockWebSocket.instances[1].simulateClose();
    vi.advanceTimersByTime(6000); // retry 2

    // Now connect successfully
    MockWebSocket.instances[2].simulateOpen();
    MockWebSocket.instances[2].simulateClose();

    // Next retry should use base interval (3s), not exponential
    vi.advanceTimersByTime(3000);
    expect(MockWebSocket.instances.length).toBe(4);
  });

  it('does not reconnect after explicit disconnect', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    connection.disconnect();

    vi.advanceTimersByTime(10000);

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('disconnect closes the WebSocket', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    const ws = MockWebSocket.instances[0];

    connection.disconnect();

    expect(ws.close).toHaveBeenCalled();
  });

  it('isConnected returns true when WebSocket is open', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    MockWebSocket.instances[0].readyState = MockWebSocket.OPEN;

    expect(connection.isConnected).toBe(true);
  });

  it('isConnected returns false before connecting', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    expect(connection.isConnected).toBe(false);
  });

  it('handles error events without crashing', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    expect(() => {
      MockWebSocket.instances[0].simulateError('connection refused');
    }).not.toThrow();
  });

  it('schedules reconnect when WebSocket constructor throws', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    MockWebSocket.shouldThrow = true;
    connection.connect();

    // No WebSocket created since constructor threw
    expect(MockWebSocket.instances).toHaveLength(0);

    // Should schedule reconnect
    MockWebSocket.shouldThrow = false;
    vi.advanceTimersByTime(3000);

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('clears existing reconnect timer when scheduling a new one', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    // First close triggers a reconnect timer
    MockWebSocket.instances[0].simulateClose();

    // Before the timer fires, connect again (resets retryCount)
    vi.advanceTimersByTime(1000);

    connection.connect();
    MockWebSocket.instances[1].simulateClose();

    // First retry after second connect at 3s
    vi.advanceTimersByTime(3000);

    // Should have: initial(0) + second-connect(1) + one-reconnect(2)
    // Not extra reconnects from the old timer
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it('does not reconnect when shouldReconnect is false', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    connection.disconnect(); // sets shouldReconnect = false

    // Simulate close after disconnect
    // (close callback would have been called, but scheduleReconnect should bail)
    vi.advanceTimersByTime(10000);

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('handles onerror with no message property', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();

    // onerror with no message property - should use 'unknown error' fallback
    expect(() => {
      MockWebSocket.instances[0].onerror?.({} as any);
    }).not.toThrow();
  });

  it('disconnect is safe when no WebSocket exists', () => {
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    // Disconnect without ever connecting - ws is null
    expect(() => connection.disconnect()).not.toThrow();
  });

  it('handles non-string message data', () => {
    const onMessage = vi.fn();
    const connection = new Connection({
      onMessage,
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    });

    connection.connect();
    // Send non-string data (e.g. ArrayBuffer) - should parse '' and fail gracefully
    MockWebSocket.instances[0].onmessage?.({ data: new ArrayBuffer(8) });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('does not schedule reconnect when shouldReconnect is false after close', () => {
    const onDisconnect = vi.fn();
    const connection = new Connection({
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect,
    });

    connection.connect();
    const ws = MockWebSocket.instances[0];

    // Disconnect sets shouldReconnect = false
    connection.disconnect();

    // Manually fire onclose (WebSocket close event fires after disconnect)
    // This triggers scheduleReconnect() which should bail because shouldReconnect is false
    ws.onclose?.({ code: 1000, reason: '', wasClean: true } as any);

    vi.advanceTimersByTime(10000);
    // No new WebSocket should have been created (only the original)
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
