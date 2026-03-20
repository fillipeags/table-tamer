import { useAppStore } from '../stores/appStore';

export function ConnectionStatus() {
  const devices = useAppStore((s) => s.devices);
  const connected = devices.length > 0;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        background: connected ? 'rgba(0, 93, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${connected ? 'rgba(0, 93, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: '6px',
          height: '6px',
          background: connected ? 'var(--color-accent)' : 'var(--color-danger)',
          boxShadow: connected ? '0 0 6px rgba(0, 93, 255, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)',
        }}
      />
      <span
        className="text-xs font-medium"
        style={{ color: connected ? 'var(--color-accent)' : 'var(--color-danger)' }}
      >
        {connected ? `${devices.length} device${devices.length !== 1 ? 's' : ''}` : 'No devices'}
      </span>
    </div>
  );
}
