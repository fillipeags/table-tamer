interface TableTamerAPI {
  onClientConnected: (callback: (event: any, clientInfo: any) => void) => () => void;
  onClientDisconnected: (callback: (event: any, clientId: string) => void) => () => void;
  onMessageReceived: (callback: (event: any, clientId: string, message: any) => void) => () => void;
  sendRequest: (clientId: string, request: any) => void;
  getServerStatus: () => Promise<{ running: boolean; port: number; clientCount: number }>;
  getClients: () => Promise<any[]>;
}

declare global {
  interface Window {
    tableTamer: TableTamerAPI;
  }
}

export {};
