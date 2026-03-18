import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tableTamer', {
  onClientConnected: (callback: (_event: any, clientInfo: any) => void) => {
    ipcRenderer.on('ws:client-connected', callback);
    return () => ipcRenderer.removeListener('ws:client-connected', callback);
  },
  onClientDisconnected: (callback: (_event: any, clientId: string) => void) => {
    ipcRenderer.on('ws:client-disconnected', callback);
    return () => ipcRenderer.removeListener('ws:client-disconnected', callback);
  },
  onMessageReceived: (callback: (_event: any, clientId: string, message: any) => void) => {
    ipcRenderer.on('ws:message-received', callback);
    return () => ipcRenderer.removeListener('ws:message-received', callback);
  },
  sendRequest: (clientId: string, request: any) => {
    ipcRenderer.send('ws:send-message', clientId, request);
  },
  getServerStatus: () => ipcRenderer.invoke('ws:get-status'),
  getClients: () => ipcRenderer.invoke('ws:get-clients'),
});
