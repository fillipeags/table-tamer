import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export function useQueryHistory() {
  const queryHistory = useAppStore((s) => s.queryHistory);
  const addQueryHistory = useAppStore((s) => s.addQueryHistory);

  const addEntry = useCallback(
    (sql: string, result?: { executionTimeMs: number; rowCount: number }, error?: string) => {
      addQueryHistory({
        id: crypto.randomUUID(),
        sql,
        timestamp: Date.now(),
        executionTimeMs: result?.executionTimeMs,
        rowCount: result?.rowCount,
        error,
      });
    },
    [addQueryHistory]
  );

  return { queryHistory, addEntry };
}
