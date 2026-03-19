import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

interface UserInfoProps {
  sendRequest: (payload: any) => Promise<any>;
}

const STORAGE_KEY = 'table-tamer-user-info-config';

function loadConfig(): { tableName: string; recordId: string } | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveConfig(config: { tableName: string; recordId: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function UserInfo({ sendRequest }: UserInfoProps) {
  const tables = useAppStore((s) => s.tables);
  const [config, setConfig] = useState(loadConfig);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Setup mode
  const [setupMode, setSetupMode] = useState(!config);
  const [selectedTable, setSelectedTable] = useState(config?.tableName || '');
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  // Suggest tables that likely contain user data
  const suggestedTables = tables.filter(t =>
    ['user', 'users', 'user_in_company', 'account', 'profile'].some(s => t.name.toLowerCase().includes(s))
  );

  const fetchUserData = useCallback(async (tableName: string, recordId: string) => {
    setLoading(true);
    try {
      const res = await sendRequest({
        action: 'execute_sql',
        sql: `SELECT * FROM "${tableName}" WHERE id = '${recordId.replace(/'/g, "''")}' LIMIT 1`,
      });
      if (res.action === 'execute_sql' && res.rows.length > 0) {
        setUserData(res.rows[0]);
        setColumns(res.columns);
      }
    } catch (e) {
      console.error('Failed to fetch user data:', e);
    }
    setLoading(false);
  }, [sendRequest]);

  const fetchPreview = useCallback(async (tableName: string) => {
    try {
      const res = await sendRequest({
        action: 'execute_sql',
        sql: `SELECT * FROM "${tableName}" LIMIT 10`,
      });
      if (res.action === 'execute_sql') {
        setPreviewRows(res.rows);
        setPreviewColumns(res.columns);
      }
    } catch { /* ignore */ }
  }, [sendRequest]);

  useEffect(() => {
    if (config && !setupMode) {
      fetchUserData(config.tableName, config.recordId);
    }
  }, [config, setupMode, fetchUserData]);

  useEffect(() => {
    if (selectedTable && setupMode) {
      fetchPreview(selectedTable);
    }
  }, [selectedTable, setupMode, fetchPreview]);

  if (setupMode) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Configure User Info</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Select the table and record that represents the logged-in user.
        </p>

        <div className="mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Table</label>
          {suggestedTables.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestedTables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className="text-[10px] px-2 py-1 rounded transition-colors"
                  style={{
                    background: selectedTable === t.name ? 'rgba(0,93,255,0.15)' : 'var(--color-surface-3)',
                    border: `1px solid ${selectedTable === t.name ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: selectedTable === t.name ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  {t.name} ({t.recordCount})
                </button>
              ))}
            </div>
          )}
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full text-xs rounded px-3 py-2"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            <option value="">Choose a table...</option>
            {tables.map(t => <option key={t.name} value={t.name}>{t.name} ({t.recordCount})</option>)}
          </select>
        </div>

        {previewRows.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Select your record</label>
            <div className="rounded-lg overflow-auto" style={{ border: '1px solid var(--color-border)', maxHeight: '300px' }}>
              {previewRows.map((row, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const id = String(row['id'] ?? '');
                    if (id) {
                      const newConfig = { tableName: selectedTable, recordId: id };
                      saveConfig(newConfig);
                      setConfig(newConfig);
                      setSetupMode(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs transition-colors flex gap-4"
                  style={{ borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', background: 'transparent' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,93,255,0.05)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {previewColumns.slice(0, 5).map(col => (
                    <div key={col} className="min-w-0">
                      <span className="text-[9px] uppercase block" style={{ color: 'var(--color-text-muted)' }}>{col}</span>
                      <span className="font-mono truncate block" style={{ maxWidth: '150px' }}>{row[col] === null ? 'NULL' : String(row[col]).slice(0, 30)}</span>
                    </div>
                  ))}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <span className="text-xs">Loading user info...</span>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <span className="text-xs">No user data found</span>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>User Info</h2>
        <button
          onClick={() => setSetupMode(true)}
          className="text-[10px] px-2 py-1 rounded transition-colors"
          style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Change
        </button>
      </div>
      <div className="text-[10px] mb-3 px-1" style={{ color: 'var(--color-text-muted)' }}>
        Source: {config?.tableName} / {config?.recordId.slice(0, 16)}...
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        {columns.map((col) => (
          <div
            key={col}
            className="flex"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <div
              className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider shrink-0"
              style={{ width: '160px', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}
            >
              {col}
            </div>
            <div
              className="flex-1 px-4 py-2.5 text-xs font-mono break-all"
              style={{ color: userData[col] === null ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
            >
              {userData[col] === null ? <span className="italic">NULL</span> : String(userData[col])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
