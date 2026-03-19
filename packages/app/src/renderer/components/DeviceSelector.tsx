import React from 'react';
import { useAppStore } from '../stores/appStore';

function getPlatformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p === 'ios') return 'iOS';
  if (p === 'android') return 'Android';
  return platform;
}

export function DeviceSelector() {
  const devices = useAppStore((s) => s.devices);
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const setActiveDevice = useAppStore((s) => s.setActiveDevice);

  if (devices.length === 0) return null;

  return (
    <div className="relative flex items-center">
      <select
        value={activeDeviceId ?? ''}
        onChange={(e) => setActiveDevice(e.target.value || null)}
        className="appearance-none text-xs rounded px-2.5 py-1 pr-6 cursor-pointer transition-colors"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
        onFocus={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = 'rgba(0, 93, 255, 0.4)';
        }}
        onBlur={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = 'var(--color-border)';
        }}
      >
        {devices.map((d) => (
          <option key={d.id} value={d.id} style={{ background: 'var(--color-surface-2)' }}>
            {d.appName} ({getPlatformLabel(d.platform)}) — v{d.appVersion}
          </option>
        ))}
      </select>
      {/* Chevron icon */}
      <div
        className="pointer-events-none absolute right-1.5 flex items-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
