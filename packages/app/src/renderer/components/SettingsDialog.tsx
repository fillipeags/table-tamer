import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { settings, updateSetting, resetDefaults } = useSettingsStore();

  const presets = [
    { name: 'Founder Blue', accent: '#005dff', bg: '#0c0e14', surface: '#12141c' },
    { name: 'Emerald', accent: '#10b981', bg: '#0c0e14', surface: '#12141c' },
    { name: 'Purple', accent: '#8b5cf6', bg: '#0c0e14', surface: '#12141c' },
    { name: 'Amber', accent: '#f59e0b', bg: '#0c0e14', surface: '#12141c' },
    { name: 'Rose', accent: '#f43f5e', bg: '#0c0e14', surface: '#12141c' },
    { name: 'Midnight', accent: '#005dff', bg: '#000000', surface: '#0a0a0a' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-[480px] max-h-[80vh] overflow-y-auto"
        style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Theme Presets */}
          <div>
            <label
              className="text-[10px] font-semibold uppercase tracking-wider block mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Theme Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => {
                const isActive = settings.accentColor === p.accent && settings.bgColor === p.bg;
                return (
                  <button
                    key={p.name}
                    onClick={() => {
                      updateSetting('accentColor', p.accent);
                      updateSetting('bgColor', p.bg);
                      updateSetting('surfaceColor', p.surface);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'var(--color-surface-2)',
                      border: `1px solid ${isActive ? p.accent : 'var(--color-border)'}`,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span
                      className="rounded-full shrink-0"
                      style={{ width: '12px', height: '12px', background: p.accent }}
                    />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div>
            <label
              className="text-[10px] font-semibold uppercase tracking-wider block mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Custom Colors
            </label>
            <div className="flex flex-col gap-2">
              <ColorInput
                label="Accent Color"
                value={settings.accentColor}
                onChange={(v) => updateSetting('accentColor', v)}
              />
              <ColorInput
                label="Background"
                value={settings.bgColor}
                onChange={(v) => updateSetting('bgColor', v)}
              />
              <ColorInput
                label="Surface"
                value={settings.surfaceColor}
                onChange={(v) => updateSetting('surfaceColor', v)}
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={resetDefaults}
            className="text-xs rounded py-2 transition-colors"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg"
      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded cursor-pointer"
          style={{ width: '24px', height: '24px', border: 'none', padding: 0 }}
        />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      </div>
      <input
        value={value}
        onChange={(e) => {
          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value);
        }}
        className="text-[10px] font-mono rounded px-2 py-1 w-20 text-right"
        style={{
          background: 'var(--color-surface-0)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );
}
