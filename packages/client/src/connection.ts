import { RECONNECT_INTERVAL_MS, DEFAULT_PORT, type Message } from '@table-tamer/core';
import { getDevServerHost } from './getDevServerHost';

const MAX_RECONNECT_INTERVAL_MS = 30_000;
const MAX_SILENT_RETRIES = 3;

export interface ConnectionOptions {
  host?: string;
  port?: number;
  onMessage: (message: Message) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export class Connection {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private retryCount = 0;
  private hasConnectedBefore = false;
  private options: Required<Pick<ConnectionOptions, 'host' | 'port'>> & ConnectionOptions;

  constructor(options: ConnectionOptions) {
    this.options = {
      ...options,
      host: options.host || getDevServerHost(),
      port: options.port || DEFAULT_PORT,
    };
  }

  connect(): void {
    this.shouldReconnect = true;
    this.retryCount = 0;
    this.attemptConnect();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: Message): void {
    // readyState 1 === OPEN (avoid relying on WebSocket.OPEN constant in RN)
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(message));
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private attemptConnect(): void {
    try {
      const url = `ws://${this.options.host}:${this.options.port}`;

      if (this.retryCount === 0) {
        console.log(`[TableTamer] Connecting to ${url}...`);
      }

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.hasConnectedBefore = true;
        console.log('[TableTamer] Connected');
        this.options.onConnect();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(typeof event.data === 'string' ? event.data : '') as Message;
          this.options.onMessage(message);
        } catch {
          console.warn('[TableTamer] Failed to parse message');
        }
      };

      this.ws.onclose = () => {
        if (this.hasConnectedBefore && this.retryCount === 0) {
          console.log('[TableTamer] Disconnected, will retry...');
        }
        this.options.onDisconnect();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Silence — onclose will follow and handle reconnection
      };
    } catch (err) {
      if (this.retryCount === 0) {
        console.warn('[TableTamer] Connection failed:', err);
      }
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    this.clearReconnectTimer();

    this.retryCount++;

    if (!this.hasConnectedBefore && this.retryCount === MAX_SILENT_RETRIES) {
      console.log(
        `[TableTamer] Desktop app not found after ${MAX_SILENT_RETRIES} attempts. ` +
        'Will keep retrying silently. Start the desktop app to connect.',
      );
    }

    const interval = Math.min(
      RECONNECT_INTERVAL_MS * Math.pow(2, this.retryCount - 1),
      MAX_RECONNECT_INTERVAL_MS,
    );
    this.reconnectTimer = setTimeout(() => {
      this.attemptConnect();
    }, interval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
