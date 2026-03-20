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
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-[520px] max-h-[80vh] overflow-y-auto"
        style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          animation: 'settingsModalIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: '28px',
                height: '28px',
                background: 'rgba(0, 93, 255, 0.12)',
                border: '1px solid rgba(0, 93, 255, 0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--color-accent)' }}>
                <path d="M6.5 1h3l.4 2.1a5.5 5.5 0 0 1 1.3.8L13.3 3l1.5 2.6-1.7 1.3a5.6 5.6 0 0 1 0 1.6l1.7 1.3-1.5 2.6-2.1-.9a5.5 5.5 0 0 1-1.3.8L9.5 15h-3l-.4-2.1a5.5 5.5 0 0 1-1.3-.8L2.7 13 1.2 10.4l1.7-1.3a5.6 5.6 0 0 1 0-1.6L1.2 6.2 2.7 3.6l2.1.9A5.5 5.5 0 0 1 6.1 3.7L6.5 1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Settings
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                Customize your experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-1.5 transition-colors"
            style={{
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Theme Presets */}
          <div>
            <label
              className="text-[10px] font-semibold uppercase tracking-wider block mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Theme Presets
            </label>
            <div className="grid grid-cols-2 gap-2.5">
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
                    className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs transition-all"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'var(--color-surface-2)',
                      border: `1.5px solid ${isActive ? p.accent : 'var(--color-border)'}`,
                      color: 'var(--color-text-secondary)',
                      boxShadow: isActive ? `0 0 12px ${p.accent}20` : 'none',
                    }}
                  >
                    {/* Color preview showing accent + bg + surface */}
                    <div
                      className="shrink-0 rounded-md overflow-hidden flex"
                      style={{
                        width: '36px',
                        height: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ width: '12px', height: '100%', background: p.accent }} />
                      <div style={{ width: '12px', height: '100%', background: p.surface }} />
                      <div style={{ width: '12px', height: '100%', background: p.bg }} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium text-xs" style={{ color: isActive ? p.accent : 'var(--color-text-primary)' }}>
                        {p.name}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        {p.accent}
                      </span>
                    </div>
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto shrink-0" style={{ color: p.accent }}>
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4.5 7L6.5 9L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />

          {/* Custom Colors */}
          <div>
            <label
              className="text-[10px] font-semibold uppercase tracking-wider block mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Custom Colors
            </label>
            <div className="flex flex-col gap-2.5">
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

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--color-border), transparent)' }} />

          {/* Reset */}
          <button
            onClick={resetDefaults}
            className="text-xs font-medium rounded-lg py-2.5 transition-all"
            style={{
              background: 'var(--color-surface-2)',
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
      className="flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative rounded-md overflow-hidden shrink-0"
          style={{
            width: '28px',
            height: '28px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="cursor-pointer absolute inset-0"
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              padding: 0,
              margin: '-6px',
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      </div>
      <input
        value={value}
        onChange={(e) => {
          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value);
        }}
        className="text-[10px] font-mono rounded-md px-2.5 py-1.5 w-20 text-right transition-colors focus-border-accent"
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
