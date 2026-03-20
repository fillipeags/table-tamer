import { useCallback, useEffect, useRef, useState } from 'react';
import { isErrorResponse } from '@table-tamer/core';
import { useConnections } from './useConnections';
import { useAppStore } from '../stores/appStore';

export function useTableRefresh(pageSize: number) {
  const { sendRequest } = useConnections();
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const tables = useAppStore((s) => s.tables);
  const tableData = useAppStore((s) => s.tableData);
  const setTables = useAppStore((s) => s.setTables);
  const setDatabaseInfo = useAppStore((s) => s.setDatabaseInfo);
  const setTableData = useAppStore((s) => s.setTableData);
  const setSchema = useAppStore((s) => s.setSchema);

  const [refreshDiff, setRefreshDiff] = useState<{
    added: string[];
    removed: string[];
    changed: { name: string; oldCount: number; newCount: number }[];
  } | null>(null);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const prevTablesRef = useRef(tables);

  // Update prevTablesRef when tables change
  useEffect(() => {
    prevTablesRef.current = tables;
  }, [tables]);

  const handleRefresh = useCallback(async () => {
    if (!activeDeviceId) return;
    const prevTables = prevTablesRef.current;

    const [infoRes, listRes] = await Promise.all([
      sendRequest({ action: 'get_database_info' }),
      sendRequest({ action: 'get_table_list' }),
    ]);

    if (!isErrorResponse(infoRes) && infoRes.action === 'get_database_info') setDatabaseInfo(infoRes);
    if (!isErrorResponse(listRes) && listRes.action === 'get_table_list') {
      const newTables = listRes.tables;
      setTables(newTables);

      // Compute diff
      const prevMap = new Map(prevTables.map(t => [t.name, t.recordCount]));
      const newMap = new Map(newTables.map(t => [t.name, t.recordCount]));
      const added = newTables.filter(t => !prevMap.has(t.name)).map(t => t.name);
      const removed = prevTables.filter(t => !newMap.has(t.name)).map(t => t.name);
      const changed = newTables.filter(t => prevMap.has(t.name) && prevMap.get(t.name) !== t.recordCount).map(t => ({ name: t.name, oldCount: prevMap.get(t.name)!, newCount: t.recordCount }));

      if (added.length || removed.length || changed.length) {
        setRefreshDiff({ added, removed, changed });
        setShowRefreshTooltip(true);
        setTimeout(() => setShowRefreshTooltip(false), 5000);
      } else {
        setRefreshDiff(null);
        setShowRefreshTooltip(true);
        setTimeout(() => setShowRefreshTooltip(false), 2000);
      }
    }

    // Re-fetch selected table data if any
    if (selectedTable) {
      const [dataRes, schemaRes] = await Promise.all([
        sendRequest({ action: 'get_table_data', tableName: selectedTable, page: 1, pageSize: tableData?.pageSize ?? pageSize }),
        sendRequest({ action: 'get_schema', tableName: selectedTable }),
      ]);
      if (!isErrorResponse(dataRes) && dataRes.action === 'get_table_data') setTableData(dataRes);
      if (!isErrorResponse(schemaRes) && schemaRes.action === 'get_schema') setSchema(schemaRes);
    }
  }, [activeDeviceId, selectedTable, sendRequest, setTables, setDatabaseInfo, setTableData, setSchema, pageSize, tableData]);

  return {
    handleRefresh,
    refreshDiff,
    showRefreshTooltip,
    setShowRefreshTooltip,
  };
}
