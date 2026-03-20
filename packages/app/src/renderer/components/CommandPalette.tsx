import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';

interface CommandPaletteProps {
  onSelectTable: (name: string) => void;
}

export function CommandPalette({ onSelectTable }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tables = useAppStore((s) => s.tables);

  // Fuzzy filter
  const filtered = useMemo(() => {
    if (!query) return tables;
    const lower = query.toLowerCase();
    return tables.filter((t) => {
      const name = t.name.toLowerCase();
      // Simple fuzzy: check if all query chars appear in order
      let qi = 0;
      for (let i = 0; i < name.length && qi < lower.length; i++) {
        if (name[i] === lower[qi]) qi++;
      }
      return qi === lower.length;
    });
  }, [tables, query]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length, query]);

  // Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      // Use a small timeout to ensure the DOM is ready
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[selectedIndex]) {
      (items[selectedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((name: string) => {
    onSelectTable(name);
    setOpen(false);
  }, [onSelectTable]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }, [filtered, selectedIndex, handleSelect]);

  // Expose open method for external triggers
  useEffect(() => {
    const handler = () => {
      setQuery('');
      setSelectedIndex(0);
      setOpen(true);
    };
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '20vh' }}
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.5)' }} />

      {/* Palette */}
      <div
        className="relative rounded-lg overflow-hidden shadow-2xl"
        style={{
          width: '460px',
          maxHeight: '400px',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2 px-3"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tables..."
            className="flex-1 text-xs py-3 bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <span
            className="text-[10px] rounded px-1.5 py-0.5 shrink-0"
            style={{
              background: 'var(--color-surface-3)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="overflow-y-auto"
          style={{ maxHeight: '320px' }}
        >
          {filtered.length === 0 ? (
            <div
              className="px-4 py-8 text-xs text-center"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {query ? `No tables matching "${query}"` : 'No tables available'}
            </div>
          ) : (
            filtered.map((table, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={table.name}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: isSelected ? 'rgba(0, 93, 255, 0.1)' : 'transparent',
                  }}
                  onClick={() => handleSelect(table.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {/* Table icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="shrink-0"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1" />
                    <line x1="5" y1="5" x2="5" y2="13" stroke="currentColor" strokeWidth="1" />
                  </svg>

                  {/* Table name */}
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                  >
                    {table.name}
                  </span>

                  {/* Record count */}
                  {table.recordCount !== undefined && (
                    <span
                      className="text-[10px] rounded px-1.5 py-px shrink-0 tabular-nums"
                      style={{
                        background: isSelected ? 'rgba(0, 93, 255, 0.15)' : 'var(--color-surface-3)',
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      }}
                    >
                      {table.recordCount.toLocaleString()} rows
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        {filtered.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 text-[10px]"
            style={{
              borderTop: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="flex items-center gap-1">
              <kbd className="rounded px-1 py-px" style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border-subtle)' }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded px-1 py-px" style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border-subtle)' }}>↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded px-1 py-px" style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border-subtle)' }}>esc</kbd>
              close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
