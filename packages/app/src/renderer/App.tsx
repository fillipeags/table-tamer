import { useState } from 'react';
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
import { ResizableSplitPane } from './components/ResizableSplitPane';
import { SettingsDialog } from './components/SettingsDialog';
import { SchemaGraph } from './components/SchemaGraph';
import { UserInfo } from './components/UserInfo';
import { CommandPalette } from './components/CommandPalette';
import { useWebSocketServer } from './hooks/useWebSocketServer';
import { useConnections } from './hooks/useConnections';
import { useDataFetching } from './hooks/useDataFetching';
import { useSqlExecution } from './hooks/useSqlExecution';
import { useTableRefresh } from './hooks/useTableRefresh';
import { useRecordOperations } from './hooks/useRecordOperations';
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

  const activeDeviceId = useAppStore((s) => s.activeDeviceId);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const loading = useAppStore((s) => s.loading);

  const {
    handleSelectTable,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
    pageSize,
  } = useDataFetching();

  const {
    handleExecuteSql,
    sqlInput,
    setSqlInput,
    sqlResult,
    sqlEditorSchema,
  } = useSqlExecution();

  const {
    handleRefresh,
    refreshDiff,
    showRefreshTooltip,
  } = useTableRefresh(pageSize);

  const { handleUpdateRecord, handleDeleteRecords } = useRecordOperations(pageSize);

  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveFromConsole, setShowSaveFromConsole] = useState(false);

  const handleSelectTableAndSwitchTab = async (name: string) => {
    setActiveTab('data');
    await handleSelectTable(name);
  };

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
          {activeDeviceId && (
            <div className="relative">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center rounded p-1 hover-text-primary"
                title="Refresh data"
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
            className="flex items-center justify-center rounded p-1 hover-text-primary"
            title="Settings"
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
          <TableList onSelectTable={handleSelectTableAndSwitchTab} />
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
                  className={`relative px-4 py-2.5 text-xs font-medium transition-colors ${!isActive ? 'hover-text-secondary' : ''}`}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
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
                    onSort={handleSort}
                  />
                )}
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="p-4 overflow-auto h-full">
                {showEmptyState ? <EmptyState /> : <SchemaViewer />}
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="h-full">
                <SchemaGraph />
              </div>
            )}

            {activeTab === 'user' && (
              <div className="h-full">
                <UserInfo sendRequest={sendRequest} />
              </div>
            )}

            {activeTab === 'sql' && (
              <ResizableSplitPane
                initialTopRatio={0.4}
                minTopHeight={150}
                minBottomHeight={120}
                top={
                  <div className="h-full p-4 pb-2">
                    <SqlConsole
                      onExecute={handleExecuteSql}
                      loading={loading['execute_sql']}
                      onSqlChange={(sql) => setSqlInput(sql)}
                      initialSql={sqlInput}
                      onSaveQuery={(sql) => { setSqlInput(sql); setShowSaveFromConsole(true); }}
                      schema={sqlEditorSchema}
                    />
                  </div>
                }
                bottom={
                  <div className="flex flex-col gap-4 p-4 pt-2 overflow-y-auto h-full">
                    <SavedQueries
                      onRunQuery={(sql) => { setSqlInput(sql); handleExecuteSql(sql); }}
                      currentSql={sqlInput}
                      externalShowSave={showSaveFromConsole}
                      onExternalSaveDone={() => setShowSaveFromConsole(false)}
                    />

                    {sqlResult && (
                      <div
                        className="rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col"
                        style={{ border: '1px solid var(--color-border)' }}
                      >
                        {/* Result header */}
                        <div
                          className="flex items-center gap-3 px-4 py-2 shrink-0"
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
                        <div className="overflow-auto flex-1">
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
                                  className="hover-row-accent"
                                  style={{
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                    borderBottom: '1px solid var(--color-border-subtle)',
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
                }
              />
            )}
          </div>
        </div>
      }
    />
    {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    <CommandPalette onSelectTable={handleSelectTableAndSwitchTab} />
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
