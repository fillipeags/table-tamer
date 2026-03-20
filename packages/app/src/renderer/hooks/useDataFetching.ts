import { useCallback, useEffect, useState } from 'react';
import { isErrorResponse, type ColumnInfo } from '@table-tamer/core';
import { useConnections } from './useConnections';
import { useAppStore } from '../stores/appStore';

export function useDataFetching() {
  const { sendRequest } = useConnections();
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const setTables = useAppStore((s) => s.setTables);
  const setSelectedTable = useAppStore((s) => s.setSelectedTable);
  const setTableData = useAppStore((s) => s.setTableData);
  const setSchema = useAppStore((s) => s.setSchema);
  const setDatabaseInfo = useAppStore((s) => s.setDatabaseInfo);
  const setAllSchemas = useAppStore((s) => s.setAllSchemas);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const tableData = useAppStore((s) => s.tableData);

  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | null>(null);

  // Fetch initial data when device connects
  useEffect(() => {
    if (!activeDeviceId) return;

    sendRequest({ action: 'get_database_info' }).then((res) => {
      if (!isErrorResponse(res) && res.action === 'get_database_info') {
        setDatabaseInfo(res);
      }
    }).catch(console.error);

    sendRequest({ action: 'get_table_list' }).then(async (res) => {
      if (!isErrorResponse(res) && res.action === 'get_table_list') {
        setTables(res.tables);
        // Fetch schemas for all tables (batch) for graph relationships
        const schemaResults: Record<string, ColumnInfo[]> = {};
        const batchSize = 10;
        for (let i = 0; i < res.tables.length; i += batchSize) {
          const batch = res.tables.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(t => sendRequest({ action: 'get_schema', tableName: t.name }))
          );
          for (const r of results) {
            if (!isErrorResponse(r) && r.action === 'get_schema') {
              schemaResults[r.tableName] = r.columns;
            }
          }
        }
        setAllSchemas(schemaResults);
      }
    }).catch(console.error);
  }, [activeDeviceId]);

  const handleSort = useCallback(
    async (column: string, direction: 'ASC' | 'DESC') => {
      if (!selectedTable) return;
      const orderBy = column || undefined;
      const orderDir = column ? direction : undefined;
      setSortColumn(orderBy ?? null);
      setSortDirection(orderDir ?? null);
      const res = await sendRequest({
        action: 'get_table_data',
        tableName: selectedTable,
        page: 1,
        pageSize,
        orderBy,
        orderDir,
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData, pageSize]
  );

  const handleSelectTable = useCallback(
    async (name: string) => {
      setSelectedTable(name);
      setSortColumn(null);
      setSortDirection(null);

      const [dataRes, schemaRes] = await Promise.all([
        sendRequest({ action: 'get_table_data', tableName: name, page: 1, pageSize }),
        sendRequest({ action: 'get_schema', tableName: name }),
      ]);

      if (!isErrorResponse(dataRes) && dataRes.action === 'get_table_data') {
        setTableData(dataRes);
      }
      if (!isErrorResponse(schemaRes) && schemaRes.action === 'get_schema') {
        setSchema(schemaRes);
      }
    },
    [sendRequest, setSelectedTable, setTableData, setSchema, pageSize]
  );

  const handlePageChange = useCallback(
    async (page: number) => {
      if (!selectedTable) return;
      const res = await sendRequest({
        action: 'get_table_data',
        tableName: selectedTable,
        page,
        pageSize,
        orderBy: sortColumn || undefined,
        orderDir: sortDirection || undefined,
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData, pageSize, sortColumn, sortDirection]
  );

  const handlePageSizeChange = useCallback(
    async (newPageSize: number) => {
      setPageSize(newPageSize);
      if (!selectedTable) return;
      const res = await sendRequest({
        action: 'get_table_data',
        tableName: selectedTable,
        page: 1,
        pageSize: newPageSize,
        orderBy: sortColumn || undefined,
        orderDir: sortDirection || undefined,
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData, sortColumn, sortDirection]
  );

  return {
    handleSelectTable,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    sortColumn,
    sortDirection,
    pageSize,
    tableData,
  };
}
