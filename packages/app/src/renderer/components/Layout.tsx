import React, { useState, useRef, useCallback } from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  header: React.ReactNode;
}

export function Layout({ sidebar, main, header }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPeeking, setSidebarPeeking] = useState(false);
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            v0.1.0
          </span>
          <button
            onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setSidebarPeeking(false); }}
            className="flex items-center justify-center rounded p-1 ml-1 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <line x1="5.5" y1="1" x2="5.5" y2="15" stroke="currentColor" strokeWidth="1.2" />
              {!sidebarCollapsed && <line x1="2" y1="5" x2="5" y2="5" stroke="currentColor" strokeWidth="1" />}
              {!sidebarCollapsed && <line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1" />}
              {!sidebarCollapsed && <line x1="2" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="1" />}
            </svg>
          </button>
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
                width: '280px',
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
            className="flex flex-col shrink-0 overflow-hidden"
            style={{
              width: '260px',
              background: 'var(--color-surface-1)',
              borderRight: '1px solid var(--color-border)',
            }}
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>
          {main}
        </main>
      </div>
    </div>
  );
}
