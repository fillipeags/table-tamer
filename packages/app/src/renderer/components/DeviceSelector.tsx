import React from 'react';
import { useAppStore } from '../stores/appStore';

export function DeviceSelector() {
  const devices = useAppStore((s) => s.devices);
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const setActiveDevice = useAppStore((s) => s.setActiveDevice);

  if (devices.length === 0) return null;

  return (
    <select
      value={activeDeviceId ?? ''}
      onChange={(e) => setActiveDevice(e.target.value || null)}
      className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700"
    >
      {devices.map((d) => (
        <option key={d.id} value={d.id}>
          {d.appName} ({d.platform}) — v{d.appVersion}
        </option>
      ))}
    </select>
  );
}
