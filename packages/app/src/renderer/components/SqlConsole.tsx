import React, { useState, useRef, useCallback } from 'react';

interface SqlConsoleProps {
  onExecute: (sql: string) => void;
  loading?: boolean;
}

export function SqlConsole({ onExecute, loading }: SqlConsoleProps) {
  const [sql, setSql] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExecute = useCallback(() => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    onExecute(trimmed);
  }, [sql, onExecute]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    },
    [handleExecute]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter SQL query... (Cmd+Enter to execute)"
          className="w-full h-32 bg-gray-900 text-gray-100 font-mono text-sm p-3 rounded-lg border border-gray-800 focus:border-emerald-500 focus:outline-none resize-y"
          spellCheck={false}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Cmd+Enter to execute</span>
        <button
          onClick={handleExecute}
          disabled={loading || !sql.trim()}
          className="px-4 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 disabled:opacity-30 transition-colors"
        >
          {loading ? 'Running...' : 'Execute'}
        </button>
      </div>
    </div>
  );
}
