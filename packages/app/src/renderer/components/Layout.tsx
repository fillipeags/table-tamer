import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  header: React.ReactNode;
}

export function Layout({ sidebar, main, header }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-emerald-400">Table Tamer</h1>
        </div>
        {header}
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-auto p-4">
          {main}
        </main>
      </div>
    </div>
  );
}
