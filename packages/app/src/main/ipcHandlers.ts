import { ipcMain } from 'electron';
import { sendMessageToClient, getServerStatus, getClients } from './wsServer';

export function registerIpcHandlers() {
  ipcMain.on('ws:send-message', (_event, clientId: string, message: any) => {
    sendMessageToClient(clientId, message);
  });

  ipcMain.handle('ws:get-status', () => {
    return getServerStatus();
  });

  ipcMain.handle('ws:get-clients', () => {
    return getClients();
  });
}
