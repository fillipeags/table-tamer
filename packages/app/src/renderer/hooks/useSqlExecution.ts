import { useCallback, useMemo, useState } from 'react';
import { isErrorResponse } from '@table-tamer/core';
import { useConnections } from './useConnections';
import { useQueryHistory } from './useQueryHistory';
import { useAppStore } from '../stores/appStore';

export function useSqlExecution() {
  const { sendRequest } = useConnections();
  const { addEntry } = useQueryHistory();
  const setSqlResult = useAppStore((s) => s.setSqlResult);
  const sqlResult = useAppStore((s) => s.sqlResult);
  const allSchemas = useAppStore((s) => s.allSchemas);

  const [sqlInput, setSqlInput] = useState('');

  // Transform allSchemas (Record<string, ColumnInfo[]>) to Record<string, string[]> for SQL autocomplete
  const sqlEditorSchema = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const [tableName, columns] of Object.entries(allSchemas)) {
      result[tableName] = columns.map((col) => col.name);
    }
    return result;
  }, [allSchemas]);

  const handleExecuteSql = useCallback(
    async (sql: string) => {
      try {
        const res = await sendRequest({ action: 'execute_sql', sql });
        if (isErrorResponse(res)) {
          addEntry(sql, undefined, res.error);
          setSqlResult(null);
        } else if (res.action === 'execute_sql') {
          addEntry(sql, { executionTimeMs: res.executionTimeMs, rowCount: res.rowCount });
          setSqlResult(res);
        }
      } catch (err) {
        addEntry(sql, undefined, err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [sendRequest, addEntry, setSqlResult]
  );

  return {
    handleExecuteSql,
    sqlInput,
    setSqlInput,
    sqlResult,
    sqlEditorSchema,
  };
}
