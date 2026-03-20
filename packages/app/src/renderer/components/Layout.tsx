import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

declare const __APP_VERSION__: string;

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;

interface LayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  header: React.ReactNode;
}

export function Layout({ sidebar, main, header }: LayoutProps) {
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(settings.sidebarCollapsed);
  const [sidebarPeeking, setSidebarPeeking] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(settings.sidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist collapsed state
  const toggleCollapsed = useCallback(() => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    setSidebarPeeking(false);
    updateSetting('sidebarCollapsed', next);
  }, [sidebarCollapsed, updateSetting]);

  // Cmd+S keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCollapsed]);

  // Resize handling
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth + (ev.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onMouseUpWithWidth = (ev: MouseEvent) => {
      setIsResizing(false);
      const finalWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, startWidth + (ev.clientX - startX)));
      updateSetting('sidebarWidth', finalWidth);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUpWithWidth);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUpWithWidth);
  }, [sidebarWidth, updateSetting]);

  const handleEdgeEnter = useCallback(() => {
    if (!sidebarCollapsed) return;
    peekTimeoutRef.current = setTimeout(() => {
      setSidebarPeeking(true);
    }, 200);
  }, [sidebarCollapsed]);

  const handleEdgeLeave = useCallback(() => {
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
      peekTimeoutRef.current = null;
    }
  }, []);

  const handlePeekLeave = useCallback(() => {
    setSidebarPeeking(false);
  }, []);

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--color-surface-0)', color: 'var(--color-text-primary)' }}>
      {/* Global resize cursor overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-[9999]" style={{ cursor: 'col-resize' }} />
      )}
      <header
        className="flex items-center justify-between pl-20 pr-3 shrink-0 select-none"
        style={{
          height: '38px',
          background: 'var(--color-surface-1)',
          borderBottom: '1px solid var(--color-border)',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div
            className="flex items-center justify-center rounded"
            style={{
              width: '20px',
              height: '20px',
              background: 'linear-gradient(135deg, #005dff 0%, #0047cc 100%)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.9" />
              <rect x="7" y="1" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="1" y="7" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Table Tamer
          </span>
          <span className="text-[10px] font-medium rounded px-1.5 py-px" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}>
            v{__APP_VERSION__}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5" style={{ background: 'rgba(0, 93, 255, 0.15)', color: 'var(--color-accent)', border: '1px solid rgba(0, 93, 255, 0.3)' }}>
            Beta
          </span>
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center rounded p-1 ml-1 hover-text-primary"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.2" />
              {!sidebarCollapsed && <line x1="2" y1="5" x2="5" y2="5" stroke="currentColor" strokeWidth="1" />}
              {!sidebarCollapsed && <line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1" />}
              {!sidebarCollapsed && <line x1="2" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="1" />}
            </svg>
          </button>
          {/* Cmd+S hint */}
          <span
            className="text-[10px] rounded px-1.5 py-0.5 select-none"
            style={{
              background: 'var(--color-surface-3)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
            }}
            title="Toggle sidebar"
          >
            {'\u2318'}S
          </span>
          {/* Cmd+K hint */}
          <span
            className="text-[10px] rounded px-1.5 py-0.5 select-none"
            style={{
              background: 'var(--color-surface-3)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-subtle)',
            }}
            title="Search tables"
          >
            {'\u2318'}K
          </span>
        </div>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {header}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Hover edge zone when collapsed */}
        {sidebarCollapsed && !sidebarPeeking && (
          <div
            className="absolute left-0 top-0 bottom-0 z-30"
            style={{ width: '24px' }}
            onMouseEnter={handleEdgeEnter}
            onMouseLeave={handleEdgeLeave}
          />
        )}

        {/* Peeking sidebar overlay */}
        {sidebarCollapsed && sidebarPeeking && (
          <>
            <div
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              onClick={() => setSidebarPeeking(false)}
            />
            <div
              className="absolute left-0 top-0 bottom-0 z-30 flex flex-col overflow-hidden"
              style={{
                width: `${sidebarWidth}px`,
                background: 'var(--color-surface-1)',
                borderRight: '1px solid var(--color-border)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
                animation: 'slideIn 0.15s ease-out',
              }}
              onMouseLeave={handlePeekLeave}
            >
              {sidebar}
            </div>
          </>
        )}

        {/* Normal sidebar */}
        {!sidebarCollapsed && (
          <aside
            className="flex flex-col shrink-0 overflow-hidden relative"
            style={{
              width: `${sidebarWidth}px`,
              background: 'var(--color-surface-1)',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            {sidebar}
            {/* Resize handle */}
            <div
              className="absolute top-0 bottom-0 right-0 z-10"
              style={{
                width: '5px',
                cursor: 'col-resize',
                transform: 'translateX(50%)',
              }}
              onMouseDown={handleResizeStart}
            >
              <div
                className="h-full transition-opacity"
                style={{
                  width: '1px',
                  marginLeft: '2px',
                  background: isResizing ? 'var(--color-accent)' : 'transparent',
                  opacity: isResizing ? 1 : 0,
                }}
              />
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>
          {main}
        </main>
      </div>
    </div>
  );
}
