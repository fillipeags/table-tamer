'use client';

import { useState } from 'react';

export function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).catch(console.error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-[#0a0c12] border border-gray-800 overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
            </svg>
            Copy
          </>
        )}
      </button>
      <pre className="p-5 text-sm text-gray-300 overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}
