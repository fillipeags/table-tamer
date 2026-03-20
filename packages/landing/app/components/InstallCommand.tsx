'use client';

import { useState } from 'react';

const managers = [
  { id: 'npm', label: 'npm', cmd: 'npm install @table-tamer/react-native' },
  { id: 'yarn', label: 'yarn', cmd: 'yarn add @table-tamer/react-native' },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add @table-tamer/react-native' },
];

export function InstallCommand() {
  const [active, setActive] = useState('npm');
  const [copied, setCopied] = useState(false);

  const current = managers.find((m) => m.id === active)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.cmd).catch(console.error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0a0c12]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-800">
        {managers.map((m) => (
          <button
            key={m.id}
            onClick={() => { setActive(m.id); setCopied(false); }}
            className={`px-4 py-2.5 text-xs font-medium transition-colors ${
              active === m.id
                ? 'text-white bg-gray-800/50 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleCopy}
          className="px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 mr-1"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Command */}
      <div className="px-5 py-4">
        <code className="text-sm text-gray-300 font-mono">
          <span className="text-gray-600 select-none">$ </span>
          {current.cmd}
        </code>
      </div>
    </div>
  );
}
