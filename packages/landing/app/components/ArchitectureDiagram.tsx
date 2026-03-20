'use client';

export function ArchitectureDiagram() {
  return (
    <div className="glass-card rounded-3xl p-10 sm:p-14 relative overflow-hidden moving-gradient-bg">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-64 h-64 rounded-full animate-glow-pulse"
          style={{ top: '-20%', left: '10%', background: 'radial-gradient(circle, rgba(0,93,255,0.1) 0%, transparent 70%)' }}
        />
        <div
          className="absolute w-48 h-48 rounded-full animate-glow-pulse"
          style={{ bottom: '-10%', right: '15%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', animationDelay: '2s' }}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest text-center mb-2 relative z-10">
        How it works
      </h2>
      <p className="text-xs text-gray-500 text-center mb-12 relative z-10">
        Three components, one seamless connection
      </p>

      {/* Desktop layout: single row with arrows inline */}
      <div className="hidden lg:flex items-center justify-center gap-0 relative z-10">
        <ArchNode color="blue" title="React Native App" sub="WatermelonDB / SQLite"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" /></svg>}
        />
        <InlineArrow label="WebSocket" />
        <ArchNode color="indigo" title="Client Library" sub="@table-tamer/react-native"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round"><path d="M4 17l6-6-6-6M12 19h8" /></svg>}
        />
        <InlineArrow label="IPC" />
        <ArchNode color="emerald" title="Desktop App" sub="Electron &middot; macOS, Win, Linux"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
        />
      </div>

      {/* Mobile layout: vertical */}
      <div className="flex lg:hidden flex-col items-center gap-4 relative z-10">
        <ArchNode color="blue" title="React Native App" sub="WatermelonDB / SQLite"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" /></svg>}
        />
        <VerticalArrow />
        <ArchNode color="indigo" title="Client Library" sub="@table-tamer/react-native"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round"><path d="M4 17l6-6-6-6M12 19h8" /></svg>}
        />
        <VerticalArrow />
        <ArchNode color="emerald" title="Desktop App" sub="Electron &middot; macOS, Win, Linux"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
        />
      </div>

      <p className="text-xs text-gray-500 text-center mt-10 max-w-lg mx-auto relative z-10">
        The desktop app starts a WebSocket server on port 8765. The client library connects automatically and responds to inspection requests.
      </p>
    </div>
  );
}

function ArchNode({ color, title, sub, icon }: { color: string; title: string; sub: string; icon: React.ReactNode }) {
  const styles: Record<string, { border: string; glow: string; text: string; iconBg: string }> = {
    blue:    { border: 'border-blue-800/30 hover:border-blue-600/50', glow: 'bg-blue-500/10', text: 'text-blue-300', iconBg: 'bg-blue-500/10' },
    indigo:  { border: 'border-indigo-800/30 hover:border-indigo-600/50', glow: 'bg-indigo-500/10', text: 'text-indigo-300', iconBg: 'bg-indigo-500/10' },
    emerald: { border: 'border-emerald-800/30 hover:border-emerald-600/50', glow: 'bg-emerald-500/10', text: 'text-emerald-300', iconBg: 'bg-emerald-500/10' },
  };
  const s = styles[color];
  return (
    <div className="group relative shrink-0">
      <div className={`absolute inset-0 ${s.glow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className={`relative rounded-2xl border ${s.border} bg-[#0d1117] px-8 py-6 text-center w-[220px] transition-all duration-300 hover:scale-[1.03]`}>
        <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mx-auto mb-3`}>
          {icon}
        </div>
        <div className={`font-semibold ${s.text} text-sm`}>{title}</div>
        <div className="text-[11px] text-gray-500 mt-1 font-mono" dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
    </div>
  );
}

function InlineArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center mx-4 shrink-0">
      <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">{label}</span>
      <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
        <line x1="0" y1="8" x2="48" y2="8" stroke="#374151" strokeWidth="1.5" strokeDasharray="6 4" className="animate-line-flow" />
        <path d="M44 3l8 5-8 5" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function VerticalArrow() {
  return (
    <svg width="16" height="32" viewBox="0 0 16 32" fill="none">
      <line x1="8" y1="0" x2="8" y2="22" stroke="#374151" strokeWidth="1.5" strokeDasharray="6 4" />
      <path d="M3 18l5 8 5-8" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
