import { useCallback } from 'react';
import { isErrorResponse } from '@table-tamer/core';
import { useConnections } from './useConnections';
import { useAppStore } from '../stores/appStore';

export function useRecordOperations(pageSize: number) {
  const { sendRequest } = useConnections();
  const setTableData = useAppStore((s) => s.setTableData);
  const setTables = useAppStore((s) => s.setTables);
  const tableData = useAppStore((s) => s.tableData);

  const handleUpdateRecord = useCallback(
    async (tableName: string, recordId: string, column: string, value: unknown) => {
      const res = await sendRequest({ action: 'update_record', tableName, recordId, column, value });
      if (!isErrorResponse(res) && res.action === 'update_record') {
        // Re-fetch table data
        const dataRes = await sendRequest({ action: 'get_table_data', tableName, page: tableData?.page ?? 1, pageSize });
        if (!isErrorResponse(dataRes) && dataRes.action === 'get_table_data') setTableData(dataRes);
      }
    },
    [sendRequest, setTableData, pageSize, tableData]
  );

  const handleDeleteRecords = useCallback(
    async (tableName: string, recordIds: string[]) => {
      const res = await sendRequest({ action: 'delete_records', tableName, recordIds });
      if (!isErrorResponse(res)) {
        // Re-fetch table data and list (counts changed)
        const [dataRes, listRes] = await Promise.all([
          sendRequest({ action: 'get_table_data', tableName, page: 1, pageSize }),
          sendRequest({ action: 'get_table_list' }),
        ]);
        if (!isErrorResponse(dataRes) && dataRes.action === 'get_table_data') setTableData(dataRes);
        if (!isErrorResponse(listRes) && listRes.action === 'get_table_list') setTables(listRes.tables);
      }
    },
    [sendRequest, setTableData, setTables, pageSize]
  );

  return {
    handleUpdateRecord,
    handleDeleteRecords,
  };
}
