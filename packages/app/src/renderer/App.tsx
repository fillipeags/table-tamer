import React, { useCallback, useEffect, useState } from 'react';
import { isErrorResponse, type ResponsePayload } from '@table-tamer/core';
import { Layout } from './components/Layout';
import { ConnectionStatus } from './components/ConnectionStatus';
import { DeviceSelector } from './components/DeviceSelector';
import { DatabaseInfo } from './components/DatabaseInfo';
import { TableList } from './components/TableList';
import { TableDataGrid } from './components/TableDataGrid';
import { SchemaViewer } from './components/SchemaViewer';
import { SqlConsole } from './components/SqlConsole';
import { QueryHistory } from './components/QueryHistory';
import { useWebSocketServer } from './hooks/useWebSocketServer';
import { useConnections } from './hooks/useConnections';
import { useQueryHistory } from './hooks/useQueryHistory';
import { useAppStore } from './stores/appStore';

type Tab = 'data' | 'schema' | 'sql';

export default function App() {
  useWebSocketServer();
  const { sendRequest } = useConnections();
  const { addEntry } = useQueryHistory();
  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const setTables = useAppStore((s) => s.setTables);
  const setSelectedTable = useAppStore((s) => s.setSelectedTable);
  const setTableData = useAppStore((s) => s.setTableData);
  const setSchema = useAppStore((s) => s.setSchema);
  const setDatabaseInfo = useAppStore((s) => s.setDatabaseInfo);
  const setSqlResult = useAppStore((s) => s.setSqlResult);
  const sqlResult = useAppStore((s) => s.sqlResult);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const loading = useAppStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [sqlInput, setSqlInput] = useState('');

  // Fetch initial data when device connects
  useEffect(() => {
    if (!activeDeviceId) return;

    sendRequest({ action: 'get_database_info' }).then((res) => {
      if (!isErrorResponse(res) && res.action === 'get_database_info') {
        setDatabaseInfo(res);
      }
    }).catch(console.error);

    sendRequest({ action: 'get_table_list' }).then((res) => {
      if (!isErrorResponse(res) && res.action === 'get_table_list') {
        setTables(res.tables);
      }
    }).catch(console.error);
  }, [activeDeviceId]);

  const handleSelectTable = useCallback(
    async (name: string) => {
      setSelectedTable(name);
      setActiveTab('data');

      const [dataRes, schemaRes] = await Promise.all([
        sendRequest({ action: 'get_table_data', tableName: name, page: 1, pageSize: 50 }),
        sendRequest({ action: 'get_schema', tableName: name }),
      ]);

      if (!isErrorResponse(dataRes) && dataRes.action === 'get_table_data') {
        setTableData(dataRes);
      }
      if (!isErrorResponse(schemaRes) && schemaRes.action === 'get_schema') {
        setSchema(schemaRes);
      }
    },
    [sendRequest, setSelectedTable, setTableData, setSchema]
  );

  const handlePageChange = useCallback(
    async (page: number) => {
      if (!selectedTable) return;
      const res = await sendRequest({
        action: 'get_table_data',
        tableName: selectedTable,
        page,
        pageSize: 50,
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData]
  );

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

  const tabs = [
    { id: 'data' as Tab, label: 'Data' },
    { id: 'schema' as Tab, label: 'Schema' },
    { id: 'sql' as Tab, label: 'SQL Console' },
  ];

  return (
    <Layout
      header={
        <div className="flex items-center gap-4">
          <DeviceSelector />
          <ConnectionStatus />
        </div>
      }
      sidebar={
        <div className="flex flex-col">
          <DatabaseInfo />
          <TableList onSelectTable={handleSelectTable} />
        </div>
      }
      main={
        <div className="flex flex-col gap-4 h-full">
          <div className="flex gap-1 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'data' && <TableDataGrid onPageChange={handlePageChange} />}
          {activeTab === 'schema' && <SchemaViewer />}
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-4">
              <SqlConsole onExecute={handleExecuteSql} loading={loading['execute_sql']} />
              {sqlResult && (
                <div className="overflow-auto rounded-lg border border-gray-800">
                  <div className="px-3 py-1.5 bg-gray-800 text-xs text-gray-400">
                    {sqlResult.rowCount} rows · {sqlResult.executionTimeMs}ms
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {sqlResult.columns.map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-400 bg-gray-900 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/30">
                          {sqlResult.columns.map((col) => (
                            <td key={col} className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">
                              {row[col] === null ? (
                                <span className="text-gray-600 italic">null</span>
                              ) : (
                                String(row[col]).slice(0, 100)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <QueryHistory onReplay={handleExecuteSql} />
            </div>
          )}

          {!selectedTable && activeTab !== 'sql' && (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              Select a table from the sidebar to inspect
            </div>
          )}
        </div>
      }
    />
  );
}
