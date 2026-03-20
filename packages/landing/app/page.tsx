import { DownloadButtons } from './components/DownloadButtons';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { InstallCommand } from './components/InstallCommand';
import { CodeBlock } from './components/CodeBlock';
import { PrismBackground } from './components/PrismBackground';

const features = [
  {
    title: 'Real-time Inspection',
    description: 'Browse tables, view records with pagination, inspect schema — all updating in real time as your app runs.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    title: 'SQL Console',
    description: 'Write and execute SQL with syntax highlighting, schema-aware autocomplete, and saved queries.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    title: 'Inline Editing',
    description: 'Double-click any cell to edit values directly. JSON fields auto-format. Edit from the detail panel too.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    title: 'Schema Graph',
    description: 'Visualize every table relationship in an interactive, draggable graph powered by ReactFlow.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="3" width="6" height="5" rx="1" /><rect x="16" y="3" width="6" height="5" rx="1" /><rect x="9" y="16" width="6" height="5" rx="1" /><path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8M12 13v3" />
      </svg>
    ),
  },
  {
    title: 'iOS & Android',
    description: 'Auto-detects your Mac IP for iOS physical devices. Android works via adb reverse. Zero config needed.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    ),
  },
  {
    title: 'Secure by Default',
    description: 'Parameterized queries prevent SQL injection. Optional read-only mode blocks all write operations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

const compatibility = [
  {
    label: 'WatermelonDB',
    value: 'v0.26+',
    sub: 'Primary support',
    color: 'blue',
  },
  {
    label: 'React Native',
    value: '0.70+',
    sub: 'Tested with 0.79',
    color: 'indigo',
  },
  {
    label: 'Mobile',
    value: 'iOS & Android',
    sub: 'Physical + Simulator',
    color: 'emerald',
  },
  {
    label: 'Desktop',
    value: 'macOS, Win, Linux',
    sub: 'Signed & notarized',
    color: 'purple',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Prism background */}
      <PrismBackground />

      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Table Tamer" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-sm">Table Tamer</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#quickstart" className="hover:text-white transition-colors">Quick Start</a>
          <a href="https://github.com/fillipeags/table-tamer" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/50 px-4 py-1.5 text-xs text-gray-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Open source &middot; MIT Licensed
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up delay-100">
          <span className="gradient-text">Inspect your database</span>
          <br />
          <span className="text-white">in real time.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed animate-fade-in-up delay-200">
          A developer tool for browsing, editing, and querying WatermelonDB/SQLite databases in React Native apps.
        </p>
        <p className="text-sm text-gray-500 mb-10 animate-fade-in-up delay-200">
          Support for expo-sqlite, Realm, and TypeORM coming soon.
        </p>

        <div className="animate-fade-in-up delay-300">
          <DownloadButtons />
        </div>
      </section>

      {/* Architecture */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <ArchitectureDiagram />
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to debug</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A complete toolkit for inspecting and modifying your React Native database during development.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card rounded-2xl p-6 transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="relative z-10 max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and running in minutes</h2>
          <p className="text-gray-400">Three steps. No complex configuration.</p>
        </div>
        <div className="space-y-10">
          <Step number={1} title="Install the client library">
            <InstallCommand />
          </Step>
          <Step number={2} title="Connect in your app (dev only)">
            <CodeBlock>{`if (__DEV__) {
  const { connectInspector } = require('@table-tamer/react-native');
  connectInspector({
    database: yourWatermelonDBInstance,
    appName: 'my-app',
    platform: Platform.OS,
  });
}`}</CodeBlock>
          </Step>
          <Step number={3} title="Open the desktop app">
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Download from the links above. It auto-connects when your RN app starts.
            </p>
            <div className="flex flex-col gap-2.5 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span><strong className="text-gray-300">iOS</strong> — works automatically (auto-detects your Mac IP)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span><strong className="text-gray-300">Android physical device</strong> — forward the port:</span>
              </div>
            </div>
            <CodeBlock>{'adb reverse tcp:8765 tcp:8765'}</CodeBlock>
          </Step>
        </div>
      </section>

      {/* Compatibility */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Compatibility</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {compatibility.map((c) => {
            const borderColors: Record<string, string> = {
              blue: 'hover:border-blue-700/50',
              indigo: 'hover:border-indigo-700/50',
              emerald: 'hover:border-emerald-700/50',
              purple: 'hover:border-purple-700/50',
            };
            const dotColors: Record<string, string> = {
              blue: 'bg-blue-500',
              indigo: 'bg-indigo-500',
              emerald: 'bg-emerald-500',
              purple: 'bg-purple-500',
            };
            return (
              <div
                key={c.label}
                className={`glass-card rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.03] ${borderColors[c.color]}`}
              >
                <div className={`w-2 h-2 rounded-full ${dotColors[c.color]} mx-auto mb-3`} />
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{c.label}</div>
                <div className="font-bold text-lg mb-1">{c.value}</div>
                <div className="text-[11px] text-gray-600">{c.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="glass-card rounded-3xl p-12 sm:p-16 moving-gradient-bg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start inspecting today</h2>
            <p className="text-gray-400 mb-10">
              Free, open source, and built for React Native developers.
            </p>
            <DownloadButtons />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="" width={18} height={18} className="rounded" />
            <span>Table Tamer</span>
            <span className="text-gray-700">&middot;</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/fillipeags/table-tamer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/@table-tamer/react-native" className="hover:text-white transition-colors">npm</a>
            <a href="https://github.com/fillipeags/table-tamer/releases" className="hover:text-white transition-colors">Releases</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <div className="w-px flex-1 bg-gray-800 mt-3" />
      </div>
      <div className="flex-1 pb-2">
        <h3 className="font-semibold text-lg mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

