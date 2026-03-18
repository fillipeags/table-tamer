import { RECONNECT_INTERVAL_MS, DEFAULT_PORT, type Message } from '@table-tamer/core';

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
  private options: Required<Pick<ConnectionOptions, 'host' | 'port'>> & ConnectionOptions;

  constructor(options: ConnectionOptions) {
    this.options = {
      host: 'localhost',
      port: DEFAULT_PORT,
      ...options,
    };
  }

  connect(): void {
    this.shouldReconnect = true;
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private attemptConnect(): void {
    try {
      const url = `ws://${this.options.host}:${this.options.port}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
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
        this.options.onDisconnect();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.attemptConnect();
    }, RECONNECT_INTERVAL_MS);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
