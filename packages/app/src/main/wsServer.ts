import { WebSocketServer, WebSocket } from 'ws';
import { DEFAULT_PORT } from '@table-tamer/core';
import { randomUUID } from 'crypto';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  appName?: string;
  appVersion?: string;
  platform?: string;
  dbName?: string;
  schemaVersion?: number;
  connectedAt: number;
}

const clients = new Map<string, ConnectedClient>();
let wss: WebSocketServer | null = null;

type EmitFn = (event: string, ...args: any[]) => void;

export function createWsServer(emit: EmitFn): WebSocketServer {
  wss = new WebSocketServer({ port: DEFAULT_PORT });
  console.log(`[TableTamer] WebSocket server listening on port ${DEFAULT_PORT}`);

  wss.on('connection', (ws) => {
    console.log('[TableTamer:main] New WS connection received');
    const clientId = randomUUID();
    const client: ConnectedClient = {
      id: clientId,
      ws,
      connectedAt: Date.now(),
    };
    clients.set(clientId, client);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        console.log('[TableTamer:main] Message received, type:', message.type);
        if (message.type === 'handshake') {
          // Update client info from handshake
          client.appName = message.payload.appName;
          client.appVersion = message.payload.appVersion;
          client.platform = message.payload.platform;
          client.dbName = message.payload.dbName;
          client.schemaVersion = message.payload.schemaVersion;

          console.log('[TableTamer:main] Emitting ws:client-connected for', client.appName);
          emit('ws:client-connected', {
            id: clientId,
            appName: client.appName,
            appVersion: client.appVersion,
            platform: client.platform,
            dbName: client.dbName,
            schemaVersion: client.schemaVersion,
          });
        } else if (message.type === 'response') {
          emit('ws:message-received', clientId, message);
        }
      } catch (err) {
        console.error('[TableTamer] Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      emit('ws:client-disconnected', clientId);
    });

    ws.on('error', (err) => {
      console.error(`[TableTamer] Client ${clientId} error:`, err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[TableTamer] WebSocket server error:', err.message);
  });

  return wss;
}

export function sendMessageToClient(clientId: string, message: any): boolean {
  const client = clients.get(clientId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) return false;
  client.ws.send(JSON.stringify(message));
  return true;
}

export function getClients(): Array<Omit<ConnectedClient, 'ws'>> {
  return Array.from(clients.values()).map(({ ws, ...rest }) => rest);
}

export function getServerStatus() {
  return {
    running: wss !== null,
    port: DEFAULT_PORT,
    clientCount: clients.size,
  };
}
