import { useAppStore } from '../stores/appStore';

export function DatabaseInfo() {
  const info = useAppStore((s) => s.databaseInfo);

  if (!info) return null;

  return (
    <div
      className="mx-3 mt-3 mb-1 rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div
          className="rounded flex items-center justify-center shrink-0"
          style={{ width: '18px', height: '18px', background: 'rgba(0, 93, 255, 0.15)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <ellipse cx="5" cy="2.5" rx="3.5" ry="1.5" stroke="#005dff" strokeWidth="1" />
            <path d="M1.5 2.5V7.5C1.5 8.33 3.07 9 5 9s3.5-.67 3.5-1.5V2.5" stroke="#005dff" strokeWidth="1" />
            <path d="M1.5 5C1.5 5.83 3.07 6.5 5 6.5S8.5 5.83 8.5 5" stroke="#005dff" strokeWidth="1" />
          </svg>
        </div>
        <span
          className="text-xs font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {info.dbName}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-0">
        <InfoCell label="Schema" value={`v${info.schemaVersion}`} />
        <InfoCell label="Tables" value={String(info.tableCount)} accent />
        <InfoCell label="Platform" value={info.platform} />
        <InfoCell label="Status" value="Active" accent />
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="px-3 py-2"
      style={{ borderTop: '1px solid var(--color-border-subtle)' }}
    >
      <div
        className="text-[10px] uppercase tracking-wider mb-0.5 font-medium"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </div>
      <div
        className="text-xs font-semibold"
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
      >
        {value}
      </div>
    </div>
  );
}
