import React, { useState, useRef, useEffect } from 'react';
import { useSavedQueriesStore, type SavedQuery } from '../stores/savedQueriesStore';

interface SavedQueriesProps {
  onRunQuery: (sql: string) => void;
  currentSql?: string;
  externalShowSave?: boolean;
  onExternalSaveDone?: () => void;
}

export function SavedQueries({ onRunQuery, currentSql, externalShowSave, onExternalSaveDone }: SavedQueriesProps) {
  const { queries, addQuery, removeQuery, importQueries, exportQueries } = useSavedQueriesStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalShowSave) {
      setShowSaveDialog(true);
    }
  }, [externalShowSave]);

  const handleSave = () => {
    if (!saveName.trim() || !currentSql?.trim()) return;
    addQuery(saveName.trim(), currentSql.trim(), saveDescription.trim() || undefined);
    setShowSaveDialog(false);
    setSaveName('');
    setSaveDescription('');
    onExternalSaveDone?.();
  };

  const handleExport = () => {
    const data = exportQueries();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-tamer-queries-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.queries && Array.isArray(data.queries)) {
          importQueries(data.queries as SavedQuery[]);
        }
      } catch {
        console.error('Invalid query file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Saved Queries ({queries.length})
        </span>
        <div className="flex items-center gap-1">
          {currentSql?.trim() && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
              style={{ color: 'var(--color-accent)' }}
              title="Save current query"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Save
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-2 py-1 rounded text-[10px] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Export all queries"
          >
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded text-[10px] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Import queries"
          >
            Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="px-4 py-4 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          No saved queries yet
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {queries.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-2 px-4 py-2 transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <div className="flex-1 min-w-0" onClick={() => onRunQuery(q.sql)}>
                <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {q.name}
                </div>
                <div className="text-[10px] font-mono truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {q.sql}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRunQuery(q.sql); }}
                className="shrink-0 p-1.5 rounded transition-colors"
                style={{ color: 'var(--color-accent)' }}
                title="Run"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), queries: [q] }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `query-${q.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="shrink-0 p-1.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Export this query"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeQuery(q.id); }}
                className="shrink-0 p-1.5 rounded transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="rounded-lg p-5 w-96"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Save Query
            </h3>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Query name..."
              className="w-full rounded text-xs px-3 py-2 mb-2"
              style={{
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <input
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full rounded text-xs px-3 py-2 mb-2"
              style={{
                background: 'var(--color-surface-0)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <div
              className="text-[10px] font-mono p-2 rounded mb-3 max-h-20 overflow-auto"
              style={{ background: 'var(--color-surface-0)', color: 'var(--color-text-muted)' }}
            >
              {currentSql}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowSaveDialog(false); onExternalSaveDone?.(); }}
                className="px-3 py-1.5 rounded text-xs"
                style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-30"
                style={{ background: 'var(--color-accent)', color: 'white' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
