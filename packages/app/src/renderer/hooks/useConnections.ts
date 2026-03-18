import { useCallback } from 'react';
import { createRequest, type RequestPayload, type ResponsePayload, REQUEST_TIMEOUT_MS } from '@table-tamer/core';
import { useAppStore } from '../stores/appStore';

export function useConnections() {
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const addPendingRequest = useAppStore((s) => s.addPendingRequest);
  const setLoading = useAppStore((s) => s.setLoading);

  const sendRequest = useCallback(
    (payload: RequestPayload): Promise<ResponsePayload> => {
      if (!activeDeviceId) {
        return Promise.reject(new Error('No device connected'));
      }

      const request = createRequest(payload);
      setLoading(payload.action, true);

      return new Promise<ResponsePayload>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Request timed out: ${payload.action}`));
          setLoading(payload.action, false);
        }, REQUEST_TIMEOUT_MS);

        addPendingRequest(
          request.id,
          payload.action,
          (response) => {
            clearTimeout(timer);
            setLoading(payload.action, false);
            resolve(response);
          },
          (err) => {
            clearTimeout(timer);
            setLoading(payload.action, false);
            reject(err);
          }
        );

        window.tableTamer.sendRequest(activeDeviceId, request);
      });
    },
    [activeDeviceId, addPendingRequest, setLoading]
  );

  return { sendRequest };
}
