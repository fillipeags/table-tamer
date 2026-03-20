import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isErrorResponse, type ResponsePayload, type ColumnInfo } from '@table-tamer/core';
import { Layout } from './components/Layout';
import { ConnectionStatus } from './components/ConnectionStatus';
import { DeviceSelector } from './components/DeviceSelector';
import { DatabaseInfo } from './components/DatabaseInfo';
import { TableList } from './components/TableList';
import { TableDataGrid } from './components/TableDataGrid';
import { SchemaViewer } from './components/SchemaViewer';
import { SqlConsole } from './components/SqlConsole';
import { QueryHistory } from './components/QueryHistory';
import { SavedQueries } from './components/SavedQueries';
import { SettingsDialog } from './components/SettingsDialog';
import { SchemaGraph } from './components/SchemaGraph';
import { UserInfo } from './components/UserInfo';
import { CommandPalette } from './components/CommandPalette';
import { useWebSocketServer } from './hooks/useWebSocketServer';
import { useConnections } from './hooks/useConnections';
import { useQueryHistory } from './hooks/useQueryHistory';
import { useAppStore } from './stores/appStore';

type Tab = 'data' | 'schema' | 'graph' | 'sql' | 'user';

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <span className="italic text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
        NULL
      </span>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className="inline-flex items-center rounded px-1.5 py-px text-[10px] font-medium"
        style={{
          background: value ? 'rgba(0, 93, 255, 0.15)' : 'rgba(239, 68, 68, 0.12)',
          color: value ? '#005dff' : '#ef4444',
        }}
      >
        {value ? 'true' : 'false'}
      </span>
    );
  }
  const str = String(value);
  const display = str.length > 100 ? str.slice(0, 100) + '…' : str;
  return <span title={str.length > 100 ? str : undefined}>{display}</span>;
}

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
  const setAllSchemas = useAppStore((s) => s.setAllSchemas);
  const sqlResult = useAppStore((s) => s.sqlResult);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const loading = useAppStore((s) => s.loading);
  const tables = useAppStore((s) => s.tables);
  const tableData = useAppStore((s) => s.tableData);

  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [sqlInput, setSqlInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveFromConsole, setShowSaveFromConsole] = useState(false);
  const [pageSize, setPageSize] = useState(50);

  // Refresh diff state
  const [refreshDiff, setRefreshDiff] = useState<{ added: string[]; removed: string[]; changed: { name: string; oldCount: number; newCount: number }[] } | null>(null);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const prevTablesRef = useRef(tables);

  // Update prevTablesRef when tables change
  useEffect(() => { prevTablesRef.current = tables; }, [tables]);

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

  const handleSelectTable = useCallback(
    async (name: string) => {
      setSelectedTable(name);
      setActiveTab('data');

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
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData, pageSize]
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
      });
      if (!isErrorResponse(res) && res.action === 'get_table_data') {
        setTableData(res);
      }
    },
    [selectedTable, sendRequest, setTableData]
  );

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'data', label: 'Data' },
    { id: 'schema', label: 'Schema' },
    { id: 'graph', label: 'Graph' },
    { id: 'sql', label: 'SQL Console' },
    { id: 'user', label: 'User Info' },
  ];

  const showEmptyState = !selectedTable && activeTab !== 'sql' && activeTab !== 'graph' && activeTab !== 'user';

  return (
    <>
    <Layout
      header={
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          {activeDeviceId && (
            <div className="relative">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center rounded p-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Refresh data"
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M13.65 2.35A8 8 0 1 0 16 8h-2a6 6 0 1 1-1.76-4.24L10 6h6V0l-2.35 2.35z" fill="currentColor" />
                </svg>
              </button>
              {showRefreshTooltip && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 rounded-lg p-3 text-xs shadow-xl"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    minWidth: '220px',
                  }}
                >
                  {refreshDiff === null ? (
                    <div style={{ color: 'var(--color-text-secondary)' }}>No changes detected</div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Changes detected
                      </div>
                      {refreshDiff.changed.map(c => (
                        <div key={c.name} className="flex items-center justify-between gap-2">
                          <span style={{ color: 'var(--color-text-secondary)' }}>{c.name}</span>
                          <span className="tabular-nums">
                            <span style={{ color: 'var(--color-text-muted)' }}>{c.oldCount}</span>
                            <span style={{ color: 'var(--color-text-muted)' }}> → </span>
                            <span style={{ color: c.newCount > c.oldCount ? 'var(--color-accent)' : 'var(--color-danger)' }}>{c.newCount}</span>
                          </span>
                        </div>
                      ))}
                      {refreshDiff.added.map(n => (
                        <div key={n} style={{ color: 'var(--color-accent)' }}>+ {n}</div>
                      ))}
                      {refreshDiff.removed.map(n => (
                        <div key={n} style={{ color: 'var(--color-danger)' }}>- {n}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DeviceSelector />
          <ConnectionStatus />
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center rounded p-1 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title="Settings"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6.5 1h3l.4 2.1a5.5 5.5 0 0 1 1.3.8L13.3 3l1.5 2.6-1.7 1.3a5.6 5.6 0 0 1 0 1.6l1.7 1.3-1.5 2.6-2.1-.9a5.5 5.5 0 0 1-1.3.8L9.5 15h-3l-.4-2.1a5.5 5.5 0 0 1-1.3-.8L2.7 13 1.2 10.4l1.7-1.3a5.6 5.6 0 0 1 0-1.6L1.2 6.2 2.7 3.6l2.1.9A5.5 5.5 0 0 1 6.1 3.7L6.5 1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          </button>
        </div>
      }
      sidebar={
        <div className="flex flex-col flex-1 overflow-hidden">
          <DatabaseInfo />
          <TableList onSelectTable={handleSelectTable} />
        </div>
      }
      main={
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab bar */}
          <div
            className="flex items-end px-4 gap-0 shrink-0"
            style={{
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-surface-1)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-4 py-2.5 text-xs font-medium transition-colors"
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                    }
                  }}
                >
                  {tab.label}
                  {/* Active underline */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 rounded-t"
                      style={{
                        height: '2px',
                        background: 'var(--color-accent)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {/* Data tab */}
            {activeTab === 'data' && (
              <div className="h-full">
                {showEmptyState ? (
                  <EmptyState />
                ) : (
                  <TableDataGrid
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onUpdateRecord={handleUpdateRecord}
                    onDeleteRecords={handleDeleteRecords}
                    tableName={selectedTable}
                  />
                )}
              </div>
            )}

            {/* Schema tab */}
            {activeTab === 'schema' && (
              <div className="p-4 overflow-auto h-full">
                {showEmptyState ? (
                  <EmptyState />
                ) : (
                  <SchemaViewer />
                )}
              </div>
            )}

            {/* Graph tab */}
            {activeTab === 'graph' && (
              <div className="h-full">
                <SchemaGraph />
              </div>
            )}

            {/* User Info tab */}
            {activeTab === 'user' && (
              <div className="h-full">
                <UserInfo sendRequest={sendRequest} />
              </div>
            )}

            {/* SQL Console tab */}
            {activeTab === 'sql' && (
              <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
                <SqlConsole
                  onExecute={handleExecuteSql}
                  loading={loading['execute_sql']}
                  onSqlChange={(sql) => setSqlInput(sql)}
                  initialSql={sqlInput}
                  onSaveQuery={(sql) => { setSqlInput(sql); setShowSaveFromConsole(true); }}
                />

                <SavedQueries
                  onRunQuery={(sql) => { setSqlInput(sql); handleExecuteSql(sql); }}
                  currentSql={sqlInput}
                  externalShowSave={showSaveFromConsole}
                  onExternalSaveDone={() => setShowSaveFromConsole(false)}
                />

                {sqlResult && (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    {/* Result header */}
                    <div
                      className="flex items-center gap-3 px-4 py-2"
                      style={{
                        background: 'var(--color-surface-2)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--color-accent)' }}>
                        <path d="M2 10L6 2L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="3.5" y1="7.5" x2="8.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Results
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        <span
                          className="text-[10px] rounded px-2 py-px"
                          style={{ background: 'rgba(0,93,255,0.1)', color: 'var(--color-accent)' }}
                        >
                          {sqlResult.rowCount} rows
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {sqlResult.executionTimeMs}ms
                        </span>
                      </div>
                    </div>

                    {/* Result table */}
                    <div className="overflow-auto" style={{ maxHeight: '360px' }}>
                      <table className="w-full text-xs border-collapse" style={{ minWidth: 'max-content' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-surface-2)' }}>
                            {sqlResult.columns.map((col) => (
                              <th
                                key={col}
                                className="sticky top-0 text-left px-3 py-2 whitespace-nowrap font-semibold"
                                style={{
                                  background: 'var(--color-surface-2)',
                                  borderBottom: '1px solid var(--color-border)',
                                  borderRight: '1px solid var(--color-border-subtle)',
                                  color: 'var(--color-text-secondary)',
                                  zIndex: 10,
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows.map((row, i) => (
                            <tr
                              key={i}
                              style={{
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                borderBottom: '1px solid var(--color-border-subtle)',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,93,255,0.04)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)';
                              }}
                            >
                              {sqlResult.columns.map((col) => (
                                <td
                                  key={col}
                                  className="px-3 py-1.5 font-mono whitespace-nowrap"
                                  style={{
                                    color: 'var(--color-text-primary)',
                                    borderRight: '1px solid var(--color-border-subtle)',
                                  }}
                                >
                                  <CellValue value={row[col]} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <QueryHistory onReplay={handleExecuteSql} />
              </div>
            )}
          </div>
        </div>
      }
    />
    {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    <CommandPalette onSelectTable={handleSelectTable} />
    </>
  );
}

function EmptyState() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-3 select-none"
      style={{ color: 'var(--color-text-muted)' }}
    >
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          width: '48px',
          height: '48px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ color: 'var(--color-text-muted)' }}>
          <rect x="2" y="2" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="8" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          No table selected
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Choose a table from the sidebar to inspect its data
        </p>
      </div>
    </div>
  );
}
