import {
  createHandshake,
  createResponse,
  type Message,
  type RequestMessage,
  type HandshakePayload,
} from '@table-tamer/core';
import type { Database } from '@nozbe/watermelondb';
import { Connection } from './connection';
import { handleRequest } from './handlers';

export interface ConnectInspectorOptions {
  database: Database;
  appName?: string;
  appVersion?: string;
  platform?: string;
  host?: string;
  port?: number;
  readOnly?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

let activeClient: TableTamerClient | null = null;

class TableTamerClient {
  private connection: Connection;
  private database: Database;
  private platform: string;
  private readOnly: boolean;
  private handshakePayload: HandshakePayload;
  private userOnConnect?: () => void;
  private userOnDisconnect?: () => void;

  constructor(options: ConnectInspectorOptions) {
    this.database = options.database;
    this.platform = options.platform || 'unknown';
    this.readOnly = options.readOnly ?? false;
    this.userOnConnect = options.onConnect;
    this.userOnDisconnect = options.onDisconnect;

    this.handshakePayload = {
      appName: options.appName || 'React Native App',
      appVersion: options.appVersion || '0.0.0',
      platform: this.platform,
      dbName: (options.database.adapter as any).dbName || 'unknown',
      schemaVersion: options.database.schema.version,
    };

    this.connection = new Connection({
      host: options.host,
      port: options.port,
      onConnect: () => this.onConnect(),
      onDisconnect: () => this.onDisconnect(),
      onMessage: (msg) => this.onMessage(msg),
    });
  }

  connect(): void {
    this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
  }

  private onConnect(): void {
    const handshake = createHandshake(this.handshakePayload);
    this.connection.send(handshake);
    this.userOnConnect?.();
  }

  private onDisconnect(): void {
    this.userOnDisconnect?.();
  }

  private async onMessage(message: Message): Promise<void> {
    if (message.type !== 'request') return;

    const request = message as RequestMessage;
    const responsePayload = await handleRequest(
      request.payload,
      this.database,
      this.platform,
      this.readOnly,
    );
    const response = createResponse(request.id, responsePayload);
    this.connection.send(response);
  }
}

export function connectInspector(options: ConnectInspectorOptions): void {
  if (activeClient) {
    activeClient.disconnect();
  }
  activeClient = new TableTamerClient(options);
  activeClient.connect();
}

export function disconnectInspector(): void {
  if (activeClient) {
    activeClient.disconnect();
    activeClient = null;
  }
}
