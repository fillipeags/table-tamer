import React from 'react';
import { useQueryHistory } from '../hooks/useQueryHistory';

interface QueryHistoryProps {
  onReplay: (sql: string) => void;
}

export function QueryHistory({ onReplay }: QueryHistoryProps) {
  const { queryHistory } = useQueryHistory();

  if (queryHistory.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="px-4 py-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400">Query History</h3>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {queryHistory.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onReplay(entry.sql)}
            className="w-full text-left px-4 py-2 text-xs font-mono hover:bg-gray-800 border-b border-gray-800/50 flex justify-between items-center"
          >
            <span className="truncate text-gray-300">{entry.sql}</span>
            <span className="shrink-0 ml-2">
              {entry.error ? (
                <span className="text-red-400">error</span>
              ) : (
                <span className="text-gray-500">
                  {entry.rowCount} rows · {entry.executionTimeMs}ms
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
