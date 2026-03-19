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
      ...options,
      host: options.host || 'localhost',
      port: options.port || DEFAULT_PORT,
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
      console.log(`[TableTamer] Attempting connection to ${url}`);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[TableTamer] WebSocket onopen fired');
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

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`[TableTamer] WebSocket onclose: code=${event.code} reason="${event.reason}" wasClean=${event.wasClean}`);
        this.options.onDisconnect();
        this.scheduleReconnect();
      };

      this.ws.onerror = (event: Event) => {
        console.error('[TableTamer] WebSocket onerror:', (event as any).message || 'unknown error');
      };
    } catch (err) {
      console.error('[TableTamer] Connection attempt threw:', err);
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
