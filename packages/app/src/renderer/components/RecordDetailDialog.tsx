import { useState, useCallback } from 'react';

function isJsonString(str: string): boolean {
  const trimmed = str.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).catch(console.error);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy value'}
      className="inline-flex items-center justify-center rounded p-0.5 transition-colors shrink-0"
      style={{
        color: copied ? 'var(--color-accent)' : 'var(--color-text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )}
    </button>
  );
}

function JsonValue({ value }: { value: string }) {
  const [formatted, setFormatted] = useState(false);

  const displayValue = formatted ? JSON.stringify(JSON.parse(value.trim()), null, 2) : value;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <button
          onClick={() => setFormatted(!formatted)}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider transition-colors"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M4 2v3c0 1-1 2-2 2s2 1 2 2v3M12 2v3c0 1 1 2 2 2s-2 1-2 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {formatted ? 'Raw' : 'Format'}
        </button>
      </div>
      <pre
        className="text-xs break-all whitespace-pre-wrap"
        style={{
          color: 'var(--color-text-primary)',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          ...(formatted
            ? {
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '6px',
                padding: '8px 10px',
                lineHeight: '1.6',
              }
            : {}),
        }}
      >
        {displayValue}
      </pre>
    </div>
  );
}

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
            const stringValue = value === null || value === undefined ? '' : String(value);
            const isJson = typeof value === 'string' && isJsonString(value);

            return (
              <div
                key={col}
                className="px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {col}
                  </div>
                  {value !== null && value !== undefined && (
                    <CopyButton value={stringValue} />
                  )}
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
                  ) : isJson ? (
                    <JsonValue value={stringValue} />
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
