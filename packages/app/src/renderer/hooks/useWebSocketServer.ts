import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function useWebSocketServer() {
  const addDevice = useAppStore((s) => s.addDevice);
  const removeDevice = useAppStore((s) => s.removeDevice);
  const resolvePendingRequest = useAppStore((s) => s.resolvePendingRequest);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    cleanups.push(
      window.tableTamer.onClientConnected((_event, clientInfo) => {
        console.log('[TableTamer:renderer] onClientConnected fired, event:', _event, 'clientInfo:', clientInfo);
        addDevice({
          id: clientInfo.id,
          appName: clientInfo.appName || 'Unknown',
          appVersion: clientInfo.appVersion || '0.0.0',
          platform: clientInfo.platform || 'unknown',
          dbName: clientInfo.dbName || 'unknown',
          schemaVersion: clientInfo.schemaVersion || 0,
        });
      })
    );

    cleanups.push(
      window.tableTamer.onClientDisconnected((_event, clientId) => {
        removeDevice(clientId);
      })
    );

    cleanups.push(
      window.tableTamer.onMessageReceived((_event, _clientId, message) => {
        if (message.type === 'response' && message.requestId) {
          resolvePendingRequest(message.requestId, message.payload);
        }
      })
    );

    return () => cleanups.forEach((fn) => fn());
  }, [addDevice, removeDevice, resolvePendingRequest]);
}
