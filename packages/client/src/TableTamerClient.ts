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
import { Platform } from 'react-native';

export interface ConnectInspectorOptions {
  database: Database;
  appName?: string;
  appVersion?: string;
  host?: string;
  port?: number;
}

let activeClient: TableTamerClient | null = null;

class TableTamerClient {
  private connection: Connection;
  private database: Database;
  private handshakePayload: HandshakePayload;

  constructor(options: ConnectInspectorOptions) {
    this.database = options.database;

    this.handshakePayload = {
      appName: options.appName || 'React Native App',
      appVersion: options.appVersion || '0.0.0',
      platform: Platform.OS,
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
    console.log('[TableTamer] Connecting...');
    this.connection.connect();
  }

  disconnect(): void {
    console.log('[TableTamer] Disconnecting...');
    this.connection.disconnect();
  }

  private onConnect(): void {
    console.log('[TableTamer] Connected to desktop app');
    // Send handshake
    const handshake = createHandshake(this.handshakePayload);
    this.connection.send(handshake);
  }

  private onDisconnect(): void {
    console.log('[TableTamer] Disconnected from desktop app');
  }

  private async onMessage(message: Message): Promise<void> {
    if (message.type !== 'request') return;

    const request = message as RequestMessage;
    const responsePayload = await handleRequest(request.payload, this.database);
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
