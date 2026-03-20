/**
 * Extract the host from a Metro bundler script URL.
 * @example extractHostFromUrl('http://192.168.0.162:8081/index.bundle') => '192.168.0.162'
 */
export function extractHostFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/:\/\/([^:/]+)/);
  return match?.[1] ?? null;
}

/**
 * Get the Metro bundler's script URL from React Native NativeModules.
 * Returns undefined when not in a React Native environment.
 */
function getScriptURL(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require('react-native');
    return (
      NativeModules?.SourceCode?.getConstants?.()?.scriptURL ??
      NativeModules?.SourceCode?.scriptURL
    );
  } catch {
    return undefined;
  }
}

/**
 * Auto-detect the development server host from the Metro bundler's script URL.
 *
 * When a React Native app runs on a physical device, Metro serves the bundle
 * via the Mac's local IP (e.g. 192.168.0.162). We extract that IP so the
 * WebSocket client can connect to the Table Tamer desktop app without the user
 * having to manually configure the host.
 *
 * Falls back to 'localhost' (works for simulators and Android with adb reverse).
 */
export function getDevServerHost(): string {
  return extractHostFromUrl(getScriptURL()) ?? 'localhost';
}
