import React, { useState } from 'react';
import { useAppStore } from '../stores/appStore';

interface TableListProps {
  onSelectTable: (name: string) => void;
}

export function TableList({ onSelectTable }: TableListProps) {
  const tables = useAppStore((s) => s.tables);
  const selectedTable = useAppStore((s) => s.selectedTable);
  const loading = useAppStore((s) => s.loading['get_table_list']);
  const [search, setSearch] = useState('');

  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Section header */}
      <div
        className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0"
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Tables
          {tables.length > 0 && (
            <span
              className="ml-1.5 rounded px-1 py-px text-[9px]"
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}
            >
              {tables.length}
            </span>
          )}
        </span>
      </div>

      {/* Search input */}
      {tables.length > 0 && (
        <div className="px-3 pb-2 shrink-0">
          <div className="relative flex items-center">
            <svg
              className="absolute left-2 pointer-events-none"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 8L10.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tables..."
              className="w-full rounded text-xs pl-6 pr-2 py-1.5 transition-colors"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'rgba(0, 93, 255, 0.4)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)';
              }}
            />
          </div>
        </div>
      )}

      {/* Table list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1.5 px-3 py-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded animate-pulse"
                style={{
                  height: '28px',
                  background: 'var(--color-surface-3)',
                  opacity: 1 - i * 0.12,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="px-3 py-6 text-xs text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {search ? `No tables matching "${search}"` : 'No tables found'}
          </div>
        ) : (
          <div className="pb-2">
            {filtered.map((table) => {
              const isSelected = selectedTable === table.name;
              return (
                <button
                  key={table.name}
                  onClick={() => onSelectTable(table.name)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all group"
                  style={{
                    background: isSelected ? 'rgba(0, 93, 255, 0.12)' : 'transparent',
                    borderLeft: `2px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  {/* Table icon */}
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    fill="none"
                    className="shrink-0"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >
                    <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                    <line x1="1" y1="4.5" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1" />
                    <line x1="4.5" y1="4.5" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1" />
                  </svg>

                  {/* Table name */}
                  <span
                    className="text-xs font-medium truncate flex-1"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                  >
                    {table.name}
                  </span>

                  {/* Record count badge */}
                  {table.recordCount !== undefined && (
                    <span
                      className="text-[10px] rounded px-1.5 py-px shrink-0 tabular-nums"
                      style={{
                        background: isSelected ? 'rgba(0, 93, 255, 0.15)' : 'var(--color-surface-3)',
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      }}
                    >
                      {table.recordCount.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
