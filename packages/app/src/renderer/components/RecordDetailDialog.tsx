
interface RecordDetailDialogProps {
  record: Record<string, unknown>;
  columns: string[];
  tableName: string;
  onClose: () => void;
}

export function RecordDetailDialog({ record, columns, tableName, onClose }: RecordDetailDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          width: '420px',
          background: 'var(--color-surface-1)',
          borderLeft: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Record Detail
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {tableName} / {String(record['id'] ?? '').slice(0, 16)}...
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded p-1 hover-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto">
          {columns.map((col) => {
            const value = record[col];
            return (
              <div
                key={col}
                className="px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {col}
                </div>
                <div className="text-xs font-mono break-all" style={{ color: value === null || value === undefined ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                  {value === null || value === undefined ? (
                    <span className="italic">NULL</span>
                  ) : typeof value === 'boolean' ? (
                    <span
                      className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-medium"
                      style={{
                        background: value ? 'rgba(0, 93, 255, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: value ? '#005dff' : '#ef4444',
                      }}
                    >
                      {value ? 'true' : 'false'}
                    </span>
                  ) : (
                    String(value)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
