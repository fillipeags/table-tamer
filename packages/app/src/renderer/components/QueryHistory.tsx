import { useState } from 'react';
import { useQueryHistory } from '../hooks/useQueryHistory';

interface QueryHistoryProps {
  onReplay: (sql: string) => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function QueryHistory({ onReplay }: QueryHistoryProps) {
  const { queryHistory } = useQueryHistory();
  const [isOpen, setIsOpen] = useState(true);

  if (queryHistory.length === 0) return null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={{
          background: 'var(--color-surface-2)',
          borderBottom: isOpen ? '1px solid var(--color-border)' : 'none',
        }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-text-muted)' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Query History
          </span>
          <span
            className="text-[10px] rounded-full px-1.5 py-px"
            style={{
              background: 'var(--color-surface-3)',
              color: 'var(--color-text-muted)',
            }}
          >
            {queryHistory.length}
          </span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            color: 'var(--color-text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <path d="M2.5 4.5L6 7.5L9.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Entry list */}
      {isOpen && (
        <div
          className="overflow-y-auto"
          style={{ maxHeight: '220px', background: 'var(--color-surface-1)' }}
        >
          {queryHistory.map((entry, i) => (
            <button
              key={entry.id}
              onClick={() => onReplay(entry.sql)}
              className="w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors group hover-row-highlight"
              style={{
                borderBottom: i < queryHistory.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
              }}
            >
              {/* Status indicator */}
              <span
                className="mt-0.5 rounded-full shrink-0"
                style={{
                  width: '6px',
                  height: '6px',
                  marginTop: '4px',
                  background: entry.error ? 'var(--color-danger)' : 'var(--color-accent)',
                  opacity: 0.7,
                }}
              />

              {/* SQL content */}
              <div className="flex-1 min-w-0">
                <div
                  className="font-mono text-[11px] truncate"
                  style={{ color: entry.error ? 'rgba(239,68,68,0.8)' : 'var(--color-text-primary)' }}
                >
                  {entry.sql}
                </div>
                {entry.error && (
                  <div
                    className="text-[10px] mt-0.5 truncate"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    {entry.error}
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div
                className="shrink-0 flex flex-col items-end gap-0.5"
                style={{ minWidth: '60px' }}
              >
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {formatTime(entry.timestamp)}
                </span>
                {!entry.error && entry.rowCount !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] rounded px-1 py-px tabular-nums"
                      style={{
                        background: 'rgba(0, 93, 255, 0.1)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {entry.rowCount} rows
                    </span>
                    {entry.executionTimeMs !== undefined && (
                      <span
                        className="text-[10px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {formatDuration(entry.executionTimeMs)}
                      </span>
                    )}
                  </div>
                )}
                {entry.error && (
                  <span
                    className="text-[10px] rounded px-1 py-px"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    error
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
