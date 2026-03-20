import React, { useCallback, useRef } from 'react';
import { SqlEditor, type SqlEditorHandle } from './SqlEditor';

interface SqlConsoleProps {
  onExecute: (sql: string) => void;
  loading?: boolean;
  onSqlChange?: (sql: string) => void;
  initialSql?: string;
  onSaveQuery?: (sql: string) => void;
  schema?: Record<string, string[]>;
}

export function SqlConsole({ onExecute, loading, onSqlChange, initialSql, onSaveQuery, schema }: SqlConsoleProps) {
  const editorRef = useRef<SqlEditorHandle>(null);
  const currentSqlRef = useRef(initialSql ?? '');

  const handleExecute = useCallback(() => {
    const trimmed = currentSqlRef.current.trim();
    if (!trimmed) return;
    onExecute(trimmed);
  }, [onExecute]);

  const handleChange = useCallback(
    (value: string) => {
      currentSqlRef.current = value;
      onSqlChange?.(value);
    },
    [onSqlChange]
  );

  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden h-full"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Editor header */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{
          background: 'var(--color-surface-2)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-accent)' }}>
          <path d="M1.5 3.5L4.5 6L1.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          SQL Query
        </span>
      </div>

      {/* CodeMirror Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SqlEditor
          ref={editorRef}
          schema={schema}
          initialValue={initialSql}
          onChange={handleChange}
          onExecute={handleExecute}
        />
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          background: 'var(--color-surface-2)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <span
          className="text-[10px] flex items-center gap-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <kbd
            className="rounded px-1 py-px text-[9px] font-mono"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            ⌘
          </kbd>
          <kbd
            className="rounded px-1 py-px text-[9px] font-mono"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            ↵
          </kbd>
          <span className="ml-0.5">to execute</span>
        </span>

        <div className="flex items-center gap-2">
          {onSaveQuery && (
            <button
              onClick={() => onSaveQuery(currentSqlRef.current)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M12 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 2v4h6V2" stroke="currentColor" strokeWidth="1.2" />
                <rect x="5" y="9" width="6" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" />
              </svg>
              Save
            </button>
          )}

          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: loading ? 'var(--color-surface-3)' : 'var(--color-accent)',
              color: loading ? 'var(--color-text-muted)' : '#ffffff',
              border: loading ? '1px solid var(--color-border)' : '1px solid transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                  <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 2L10 6L3 10V2Z" fill="currentColor" />
                </svg>
                Execute
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
