import React, { useState, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { RecordDetailDialog } from './RecordDetailDialog';

interface TableDataGridProps {
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onUpdateRecord?: (tableName: string, recordId: string, column: string, value: unknown) => Promise<void>;
  onDeleteRecords?: (tableName: string, recordIds: string[]) => Promise<void>;
  tableName?: string | null;
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <span
        className="italic text-[10px]"
        style={{ color: 'var(--color-text-muted)' }}
      >
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
  const display = str.length > 120 ? str.slice(0, 120) + '…' : str;

  return (
    <span title={str.length > 120 ? str : undefined}>
      {display}
    </span>
  );
}

export function TableDataGrid({ onPageChange, onPageSizeChange, onUpdateRecord, onDeleteRecords, tableName }: TableDataGridProps) {
  const tableData = useAppStore((s) => s.tableData);
  const loading = useAppStore((s) => s.loading['get_table_data']);

  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [detailRecord, setDetailRecord] = useState<{ record: Record<string, unknown>; index: number } | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{
    tableName: string;
    recordId: string;
    column: string;
    oldValue: unknown;
    newValue: string;
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);

  if (!tableData) return null;

  const totalPages = Math.ceil(tableData.totalCount / tableData.pageSize);
  const startRow = (tableData.page - 1) * tableData.pageSize + 1;
  const endRow = Math.min(tableData.page * tableData.pageSize, tableData.totalCount);

  const allRowIds = tableData.rows.map((row) => String(row['id'] ?? ''));
  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedRows.has(id));
  const someSelected = allRowIds.some((id) => selectedRows.has(id));

  const handleSelectAll = () => {
    if (allSelected) {
      const next = new Set(selectedRows);
      allRowIds.forEach((id) => next.delete(id));
      setSelectedRows(next);
    } else {
      const next = new Set(selectedRows);
      allRowIds.forEach((id) => { if (id) next.add(id); });
      setSelectedRows(next);
    }
  };

  const handleSelectRow = (recordId: string) => {
    if (!recordId) return;
    const next = new Set(selectedRows);
    if (next.has(recordId)) {
      next.delete(recordId);
    } else {
      next.add(recordId);
    }
    setSelectedRows(next);
  };

  const handleCellDoubleClick = (rowIndex: number, column: string, currentValue: unknown) => {
    if (!onUpdateRecord || !tableName) return;
    if (column === 'id') return;
    setEditingCell({ rowIndex, column });
    setEditValue(currentValue === null || currentValue === undefined ? 'NULL' : String(currentValue));
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, column: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(rowIndex, column);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditBlur = (rowIndex: number, column: string) => {
    if (editingCell?.rowIndex === rowIndex && editingCell?.column === column) {
      commitEdit(rowIndex, column);
    }
  };

  const commitEdit = (rowIndex: number, column: string) => {
    if (!tableName) return;
    const row = tableData.rows[rowIndex];
    if (!row) return;
    const recordId = String(row['id'] ?? '');
    if (!recordId) return;
    const oldValue = row[column];
    const newValue = editValue;

    const oldStr = oldValue === null || oldValue === undefined ? 'NULL' : String(oldValue);
    if (newValue === oldStr) {
      setEditingCell(null);
      return;
    }

    setPendingEdit({ tableName, recordId, column, oldValue, newValue });
    setShowConfirmDialog(true);
    setEditingCell(null);
  };

  // Column count: checkbox + view + row# + data columns
  const totalColSpan = tableData.columns.length + 3;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Data table area */}
      <div
        className="flex-1 overflow-auto"
        style={{ minHeight: 0 }}
      >
        <table
          className="w-full border-collapse text-xs"
          style={{ minWidth: 'max-content' }}
        >
          <thead>
            <tr style={{ background: 'var(--color-surface-2)' }}>
              {/* Checkbox column */}
              <th className="sticky top-0 z-10 text-center py-2 font-medium select-none" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border-subtle)', width: '28px', minWidth: '28px' }}>
                <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={handleSelectAll} className="cursor-pointer" style={{ accentColor: 'var(--color-accent)', width: '13px', height: '13px' }} title="Select all" />
              </th>
              {/* View detail column */}
              <th className="sticky top-0 z-10 text-center py-2 font-medium select-none" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border-subtle)', width: '28px', minWidth: '28px' }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ margin: '0 auto', color: 'var(--color-text-muted)' }}><path d="M8 4C5.07 4 2.52 5.95 1.5 8.5c1.02 2.55 3.57 4.5 6.5 4.5s5.48-1.95 6.5-4.5C13.48 5.95 10.93 4 8 4z" fill="currentColor" fillOpacity="0.3" /></svg>
              </th>
              {/* Row number column */}
              <th className="sticky top-0 z-10 text-right px-2 py-2 font-medium select-none" style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-muted)', width: '36px', minWidth: '36px', fontSize: '10px' }}>#</th>
              {tableData.columns.map((col) => (
                <th
                  key={col}
                  className="sticky top-0 z-10 text-left px-3 py-2 whitespace-nowrap font-semibold"
                  style={{
                    background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border)',
                    borderRight: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-secondary)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="px-4 py-8 text-center"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#005dff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : tableData.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColSpan}
                  className="px-4 py-8 text-center text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  No rows in this table
                </td>
              </tr>
            ) : (
              tableData.rows.map((row, i) => {
                const isEven = i % 2 === 0;
                const rowNumber = startRow + i;
                const recordId = String(row['id'] ?? '');
                const isRowSelected = recordId ? selectedRows.has(recordId) : false;
                return (
                  <tr
                    key={i}
                    className="group"
                    style={{
                      background: isRowSelected
                        ? 'rgba(0, 93, 255, 0.07)'
                        : isEven ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isRowSelected) {
                        (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0, 93, 255, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRowSelected) {
                        (e.currentTarget as HTMLTableRowElement).style.background = isEven ? 'transparent' : 'rgba(255,255,255,0.015)';
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <td className="text-center py-1 select-none" style={{ borderBottom: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border-subtle)', width: '28px' }}>
                      <input type="checkbox" checked={isRowSelected} onChange={() => handleSelectRow(recordId)} className="cursor-pointer" style={{ accentColor: 'var(--color-accent)', width: '13px', height: '13px' }} />
                    </td>
                    {/* View detail */}
                    <td className="text-center py-1 select-none" style={{ borderBottom: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border-subtle)', width: '28px' }}>
                      <button onClick={() => setDetailRecord({ record: row, index: i })} title="View details" style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, padding: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 4C5.07 4 2.52 5.95 1.5 8.5c1.02 2.55 3.57 4.5 6.5 4.5s5.48-1.95 6.5-4.5C13.48 5.95 10.93 4 8 4zm0 7.5c-1.52 0-2.75-1.23-2.75-2.75S6.48 6 8 6s2.75 1.23 2.75 2.75S9.52 11.5 8 11.5zM8 7.25c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25z" fill="currentColor" /></svg>
                      </button>
                    </td>
                    {/* Row number */}
                    <td className="text-right px-2 py-1 tabular-nums select-none" style={{ borderBottom: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '10px', width: '36px' }}>
                      {rowNumber}
                    </td>
                    {tableData.columns.map((col) => {
                      const isEditing = editingCell?.rowIndex === i && editingCell?.column === col;
                      const canEdit = onUpdateRecord && tableName && col !== 'id';
                      return (
                        <td
                          key={col}
                          className="px-3 py-1.5 font-mono whitespace-nowrap max-w-xs overflow-hidden text-ellipsis"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            borderRight: '1px solid var(--color-border-subtle)',
                            cursor: canEdit ? 'text' : 'default',
                            padding: isEditing ? '0' : undefined,
                          }}
                          onDoubleClick={() => canEdit && handleCellDoubleClick(i, col, row[col])}
                          title={canEdit && !isEditing ? 'Double-click to edit' : undefined}
                        >
                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, i, col)}
                              onBlur={() => handleEditBlur(i, col)}
                              autoFocus
                              className="w-full h-full font-mono text-xs px-3 py-1.5"
                              style={{
                                background: 'rgba(0, 93, 255, 0.08)',
                                border: '1px solid rgba(0, 93, 255, 0.5)',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                minWidth: '80px',
                              }}
                            />
                          ) : (
                            <CellValue value={row[col]} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selection action bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'rgba(0,93,255,0.08)', borderTop: '1px solid rgba(0,93,255,0.2)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedRows(new Set())} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
              Clear
            </button>
            <button
              onClick={() => {
                if (!tableName || !onDeleteRecords) return;
                setShowDeleteConfirm(true);
              }}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded font-medium"
              style={{ background: 'var(--color-danger)', color: 'white' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4h10l-1 10H4L3 4zM6 2h4M2 4h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              Delete {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Pagination bar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-1)',
        }}
      >
        <span
          className="text-xs tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {tableData.totalCount === 0
            ? 'No records'
            : `Showing ${startRow.toLocaleString()}–${endRow.toLocaleString()} of ${tableData.totalCount.toLocaleString()} records`}
        </span>

        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Rows:</span>
            <select
              value={tableData.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none text-xs rounded px-2 py-0.5 cursor-pointer"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                outline: 'none',
              }}
            >
              {[25, 50, 100, 250, 500].map(size => (
                <option key={size} value={size} style={{ background: 'var(--color-surface-2)' }}>{size}</option>
              ))}
            </select>
          </div>

          {/* Prev/Next buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(tableData.page - 1)}
              disabled={tableData.page <= 1 || loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-30"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Prev
            </button>

            <span
              className="px-3 py-1 text-xs tabular-nums"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {tableData.page} / {totalPages}
            </span>

            <button
              onClick={() => onPageChange(tableData.page + 1)}
              disabled={tableData.page >= totalPages || loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-30"
              style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Next
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Record detail dialog */}
      {detailRecord && tableData && (
        <RecordDetailDialog
          record={detailRecord.record}
          columns={tableData.columns}
          tableName={tableName || ''}
          onClose={() => setDetailRecord(null)}
        />
      )}

      {/* Confirm edit dialog */}
      {showConfirmDialog && pendingEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-lg p-5 max-w-md" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-warning)' }}>
                <path d="M10 2L18 17H2L10 2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="14.5" r="0.75" fill="currentColor"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Confirm Edit</span>
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              You are about to modify the database directly. This action cannot be undone.
            </p>
            <div className="text-xs mt-3 rounded p-2.5 font-mono" style={{ background: 'var(--color-surface-0)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>
                UPDATE "{pendingEdit.tableName}"."{pendingEdit.column}"
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>SET </span>
                <span style={{ color: 'var(--color-danger)' }}>{String(pendingEdit.oldValue)}</span>
                <span style={{ color: 'var(--color-text-muted)' }}> → </span>
                <span style={{ color: 'var(--color-accent)' }}>{String(pendingEdit.newValue)}</span>
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>WHERE id = '{pendingEdit.recordId}'</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowConfirmDialog(false); setPendingEdit(null); setEditingCell(null); }}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (pendingEdit && onUpdateRecord && tableName) {
                    await onUpdateRecord(tableName, pendingEdit.recordId, pendingEdit.column, pendingEdit.newValue === 'NULL' ? null : pendingEdit.newValue);
                  }
                  setShowConfirmDialog(false);
                  setPendingEdit(null);
                  setEditingCell(null);
                }}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: 'var(--color-accent)', color: 'white' }}
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-lg p-5 max-w-md" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--color-danger)' }}>
                <path d="M10 2L18 17H2L10 2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10" cy="14.5" r="0.75" fill="currentColor"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Confirm Delete</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              You are about to permanently delete <strong>{selectedRows.size}</strong> record{selectedRows.size !== 1 ? 's' : ''} from <strong>{tableName}</strong>. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button
                onClick={async () => {
                  if (tableName && onDeleteRecords) {
                    await onDeleteRecords(tableName, Array.from(selectedRows));
                    setSelectedRows(new Set());
                  }
                  setShowDeleteConfirm(false);
                }}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: 'var(--color-danger)', color: 'white' }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
