import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizableSplitPaneProps {
  top: React.ReactNode;
  bottom: React.ReactNode;
  initialTopRatio?: number;
  minTopHeight?: number;
  minBottomHeight?: number;
}

export function ResizableSplitPane({
  top,
  bottom,
  initialTopRatio = 0.4,
  minTopHeight = 100,
  minBottomHeight = 100,
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topRatio, setTopRatio] = useState(initialTopRatio);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = rect.height;
      const dividerHeight = 6;
      const availableHeight = totalHeight - dividerHeight;

      const offsetY = e.clientY - rect.top;
      let newTopHeight = offsetY;

      // Enforce min heights
      newTopHeight = Math.max(minTopHeight, newTopHeight);
      newTopHeight = Math.min(availableHeight - minBottomHeight, newTopHeight);

      setTopRatio(newTopHeight / totalHeight);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minTopHeight, minBottomHeight]);

  const topPercent = `${topRatio * 100}%`;
  const dividerHeight = 6;

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Top pane */}
      <div
        className="overflow-hidden shrink-0"
        style={{ height: topPercent }}
      >
        {top}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="shrink-0 flex items-center justify-center group"
        style={{
          height: `${dividerHeight}px`,
          cursor: 'row-resize',
          background: 'var(--color-surface-0)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="rounded-full transition-colors"
          style={{
            width: '32px',
            height: '2px',
            background: 'var(--color-text-muted)',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Bottom pane */}
      <div className="flex-1 overflow-hidden min-h-0">
        {bottom}
      </div>
    </div>
  );
}
