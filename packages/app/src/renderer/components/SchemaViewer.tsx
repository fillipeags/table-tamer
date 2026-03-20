import { useAppStore } from '../stores/appStore';

type ColumnType = 'string' | 'number' | 'boolean' | string;

function TypeBadge({ type }: { type: ColumnType }) {
  const config: Record<string, { bg: string; color: string }> = {
    string: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
    number: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' },
    boolean: { bg: 'rgba(0, 93, 255, 0.15)', color: '#005dff' },
    date: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
  };

  const style = config[type.toLowerCase()] ?? { bg: 'rgba(255,255,255,0.06)', color: '#8b8fa3' };

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {type}
    </span>
  );
}

function BadgePill({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-px text-[10px] font-medium"
      style={{
        background: 'rgba(0, 93, 255, 0.1)',
        color: 'var(--color-accent)',
        border: '1px solid rgba(0, 93, 255, 0.2)',
      }}
    >
      {label}
    </span>
  );
}

export function SchemaViewer() {
  const schema = useAppStore((s) => s.schema);

  if (!schema) return null;

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--color-accent)' }}>
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.2" />
          <line x1="5" y1="5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {schema.tableName}
        </span>
        <span
          className="text-[10px] rounded-full px-2 py-px ml-auto"
          style={{
            background: 'var(--color-surface-3)',
            color: 'var(--color-text-muted)',
          }}
        >
          {schema.columns.length} columns
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: 'var(--color-surface-1)' }}>
              <th
                className="text-left px-4 py-2 font-semibold"
                style={{
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Column
              </th>
              <th
                className="text-left px-4 py-2 font-semibold"
                style={{
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Type
              </th>
              <th
                className="text-left px-4 py-2 font-semibold"
                style={{
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Attributes
              </th>
            </tr>
          </thead>
          <tbody>
            {schema.columns.map((col, i) => (
              <tr
                key={col.name}
                className="hover-row-accent"
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <td
                  className="px-4 py-2 font-mono font-medium"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {col.name}
                </td>
                <td className="px-4 py-2">
                  <TypeBadge type={col.type} />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <BadgePill label="optional" active={col.isOptional} />
                    <BadgePill label="indexed" active={col.isIndexed} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
