import { useState, useEffect } from 'react';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready';

export function UpdateBanner() {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!window.tableTamer?.onUpdateAvailable) return;

    const cleanups = [
      window.tableTamer.onUpdateAvailable((_e, v) => {
        setState('available');
        setVersion(v);
      }),
      window.tableTamer.onUpdateDownloadProgress((_e, pct) => {
        setState('downloading');
        setProgress(pct);
      }),
      window.tableTamer.onUpdateDownloaded((_e, v) => {
        setState('ready');
        setVersion(v);
      }),
    ];

    return () => cleanups.forEach((c) => c());
  }, []);

  if (state === 'idle') return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
      style={{
        background: state === 'ready' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 93, 255, 0.12)',
        color: state === 'ready' ? '#10b981' : 'var(--color-accent)',
        border: `1px solid ${state === 'ready' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 93, 255, 0.25)'}`,
      }}
    >
      {state === 'available' && (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="2" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          v{version} available
        </>
      )}

      {state === 'downloading' && (
        <>
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
            <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Downloading {progress}%
        </>
      )}

      {state === 'ready' && (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>v{version} ready</span>
          <button
            onClick={() => window.tableTamer.installUpdate()}
            className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
            style={{
              background: '#10b981',
              color: '#fff',
            }}
          >
            Restart
          </button>
        </>
      )}
    </div>
  );
}
