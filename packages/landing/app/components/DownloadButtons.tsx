'use client';

import { useEffect, useState } from 'react';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  assets: ReleaseAsset[];
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function getAsset(assets: ReleaseAsset[], pattern: RegExp): ReleaseAsset | undefined {
  return assets.find((a) => pattern.test(a.name));
}

const platforms = [
  {
    key: 'mac',
    label: 'Download for macOS',
    shortLabel: 'macOS',
    pattern: /\.dmg$/,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    key: 'win',
    label: 'Download for Windows',
    shortLabel: 'Windows',
    pattern: /Setup.*\.exe$/,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M0 2.3l6.5-.9v6.3H0V2.3zm7.3-1L16 0v7.7H7.3V1.3zM16 8.7V16l-8.7-1.2V8.7H16zM6.5 14.6l-6.5-.9V8.7h6.5v5.9z" />
      </svg>
    ),
  },
  {
    key: 'linux-deb',
    label: 'Download .deb',
    shortLabel: 'Linux .deb',
    pattern: /\.deb$/,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.199.025.395.003.59-.064.18-.06.395-.174.78-.46.26-.197.545-.471.92-.678a.26.26 0 00.07-.04c.386-.25.672-.58.898-.874a4.89 4.89 0 00.44-.739c.16-.334.3-.688.324-1.09.028-.4-.106-.866-.465-1.2a1.66 1.66 0 00-.498-.338 2.1 2.1 0 00-.37-.133 2.74 2.74 0 00-.222-.04c-.11-.013-.234-.026-.332-.028a7.6 7.6 0 00-1.034.072 5.17 5.17 0 01-.677.035c-.203 0-.304-.07-.38-.188-.088-.124-.14-.32-.18-.499a5.81 5.81 0 01-.065-.635 10.4 10.4 0 01.031-1.163c.04-.454.06-.944.04-1.35a5.66 5.66 0 00-.182-1.23c-.12-.39-.31-.735-.634-1.02-.488-.416-.933-.448-1.153-.448h-.014c-.36.004-.66.11-.934.28-.39.24-.694.555-1.014.874l-.003.003a6.3 6.3 0 01-.694.626 4.52 4.52 0 01-.694.43 4.07 4.07 0 01-.742.264 4.48 4.48 0 01-.872.11c-.338.01-.537-.039-.71-.148-.175-.112-.334-.303-.56-.628-.113-.16-.228-.353-.358-.57L8.82 11.1a57.03 57.03 0 00-.343-.55c-.188-.27-.398-.503-.616-.63-.218-.133-.448-.17-.691-.17-.27 0-.53.07-.776.175a4.02 4.02 0 00-.692.38 4.84 4.84 0 00-.578.44 7.73 7.73 0 00-.496.495c-.055.06-.098.114-.14.172-.1.144-.18.296-.218.47a1.26 1.26 0 00-.023.3l.003.037c.027.23.096.4.19.535.093.13.206.216.328.28.244.13.512.148.74.145.106-.002.185-.018.27-.024.034-.003.064-.003.094-.003.16 0 .271.03.38.09.108.058.204.14.306.25.204.22.404.537.654.916l.012.018c.16.243.32.504.493.727.181.23.383.427.61.537.113.057.225.089.342.089.153 0 .282-.057.39-.133l.004-.003.012-.008c.3-.194.53-.423.738-.616.11-.1.21-.19.31-.266.095-.074.186-.128.284-.16a.94.94 0 01.272-.043c.14 0 .27.03.38.08.112.05.206.12.292.2.17.16.304.378.408.62.104.244.182.51.232.776.05.268.076.53.084.776.01.246.003.468-.02.66-.051.426-.176.798-.383 1.07a1.34 1.34 0 01-.517.399 2.04 2.04 0 01-.715.148c-.294.01-.566-.038-.81-.096a3.57 3.57 0 01-.64-.213 3.82 3.82 0 01-.553-.29c-.183-.112-.336-.234-.48-.358l-.013-.011-.013-.012a.35.35 0 00-.215-.087.37.37 0 00-.234.072.36.36 0 00-.129.196.37.37 0 00.014.244c.094.27.234.53.415.77.182.237.4.452.655.635.255.18.548.32.874.408.326.087.685.118 1.07.078a2.9 2.9 0 001.002-.31c.33-.166.623-.397.863-.69.24-.295.424-.65.536-1.068.112-.42.148-.903.09-1.45a6.22 6.22 0 00-.12-.677 5.25 5.25 0 00-.2-.594z" />
      </svg>
    ),
  },
];

export function DownloadButtons() {
  const [release, setRelease] = useState<Release | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/fillipeags/table-tamer/releases/latest')
      .then((r) => r.json())
      .then((data) => {
        if (data.tag_name && data.assets) setRelease(data);
      })
      .catch(console.error);
  }, []);

  if (!release) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-64 rounded-xl bg-gray-800 animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 rounded-lg bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const macAsset = getAsset(release.assets, /\.dmg$/);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Primary CTA */}
      {macAsset && (
        <a
          href={macAsset.browser_download_url}
          className="inline-flex items-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          {platforms[0].icon}
          Download for macOS
          <span className="text-blue-200 text-xs font-normal">{formatSize(macAsset.size)}</span>
        </a>
      )}

      {/* Secondary platforms */}
      <div className="flex flex-wrap justify-center gap-3">
        {platforms.slice(1).map((p) => {
          const asset = getAsset(release.assets, p.pattern);
          if (!asset) return null;
          return (
            <a
              key={p.key}
              href={asset.browser_download_url}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-900/50 px-4 py-2.5 text-xs font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {p.icon}
              {p.shortLabel}
              <span className="text-gray-500">{formatSize(asset.size)}</span>
            </a>
          );
        })}
      </div>

      {/* Version tag */}
      <p className="text-xs text-gray-600">
        {release.tag_name} &middot;{' '}
        <a
          href="https://github.com/fillipeags/table-tamer/releases/latest"
          className="underline hover:text-gray-400 transition-colors"
        >
          Release notes
        </a>
      </p>
    </div>
  );
}
