interface TableTamerAPI {
  onClientConnected: (callback: (event: any, clientInfo: any) => void) => () => void;
  onClientDisconnected: (callback: (event: any, clientId: string) => void) => () => void;
  onMessageReceived: (callback: (event: any, clientId: string, message: any) => void) => () => void;
  sendRequest: (clientId: string, request: any) => void;
  getServerStatus: () => Promise<{ running: boolean; port: number; clientCount: number }>;
  getClients: () => Promise<any[]>;
  onUpdateAvailable: (callback: (event: any, version: string) => void) => () => void;
  onUpdateDownloadProgress: (callback: (event: any, percent: number) => void) => () => void;
  onUpdateDownloaded: (callback: (event: any, version: string) => void) => () => void;
  installUpdate: () => void;
}

declare global {
  interface Window {
    tableTamer: TableTamerAPI;
  }
}

export {};
