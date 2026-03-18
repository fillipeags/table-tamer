import React from 'react';
import { useAppStore } from '../stores/appStore';

export function ConnectionStatus() {
  const devices = useAppStore((s) => s.devices);
  const connected = devices.length > 0;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <span className="text-sm text-gray-400">
        {connected ? `${devices.length} device(s)` : 'No devices'}
      </span>
    </div>
  );
}
