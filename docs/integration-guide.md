# Table Tamer Integration Guide

This guide explains how to integrate Table Tamer into your React Native project that uses WatermelonDB.

## Prerequisites

- React Native 0.70+
- WatermelonDB 0.26+ (0.28 recommended)
- A WatermelonDB `Database` instance in your app

## Step 1: Install packages

```bash
# npm
npm install table-tamer

# yarn
yarn add table-tamer

# pnpm
pnpm add table-tamer
```

> **Note**: The `table-tamer` package re-exports everything from `@table-tamer/client` and `@table-tamer/core`. You only need this one package.

## Step 2: Create configuration file

Create `src/config/TableTamerConfig.ts` (or `.js`):

```typescript
import { Platform } from 'react-native';

if (__DEV__) {
  // Lazy require to avoid bundling in production
  const { connectInspector } = require('table-tamer');

  // Import your WatermelonDB instance
  const wmdb = require('../wmdb/wmdb').default; // adjust path

  connectInspector({
    database: wmdb,
    appName: 'my-app',            // Shows in desktop app
    appVersion: '1.0.0',          // Shows in desktop app
    platform: Platform.OS,        // 'ios' or 'android'
    port: 8765,                   // Must match desktop app port
  });
}
```

## Step 3: Import in entry point

Add the import to your app's entry point (usually `index.js`):

```javascript
if (__DEV__) {
  require('./src/config/TableTamerConfig');
}
```

Place this **after** your Reactotron import (if you have one) and **before** your app registration.

## Step 4: Physical device setup

### Android

Forward the WebSocket port via ADB:

```bash
adb reverse tcp:8765 tcp:8765
```

> **Tip**: Add this to your npm scripts:
> ```json
> "table-tamer": "adb reverse tcp:8765 tcp:8765"
> ```

### iOS Simulator

Works out of the box — `localhost` on the simulator routes to the host machine.

### iOS Physical Device

Not directly supported via `localhost`. You'll need to use your computer's local IP address:

```typescript
connectInspector({
  database: wmdb,
  host: '192.168.1.100', // your computer's IP
  port: 8765,
});
```

## Step 5: Launch desktop app

1. Download from [Releases](https://github.com/fillipeags/table-tamer/releases)
2. Open Table Tamer
3. Start your React Native app
4. The device should appear in the desktop app automatically

## Development Workflow (Contributing to Table Tamer)

If you're developing Table Tamer itself and testing changes against a React Native app, follow this workflow.

### Initial setup

```bash
# Clone the monorepo
git clone https://github.com/fillipeags/table-tamer.git
cd table-tamer

# Install dependencies
pnpm install

# Build all packages (core → client → app)
pnpm build
```

### Link Table Tamer to your React Native project

In your RN project's `package.json`, add a `file:` reference pointing to the local packages:

```json
{
  "devDependencies": {
    "@table-tamer/client": "file:../table-tamer/packages/client"
  }
}
```

Then install:

```bash
# yarn
yarn install --force

# npm
npm install
```

> **Important**: The `file:` link copies the `dist/` folder at install time. Every time you rebuild the client, you need to re-install in the RN project to pick up changes.

### Development loop

The typical development cycle involves 3 terminals:

**Terminal 1 — Desktop app (Electron)**
```bash
cd table-tamer

# Rebuild everything and launch the desktop app
pnpm build && pnpm --filter @table-tamer/app dev
```

**Terminal 2 — React Native Metro bundler**
```bash
cd your-rn-app
yarn start --reset-cache
```

**Terminal 3 — Sync changes** (run after every code change to core/client)
```bash
# In the table-tamer directory:
pnpm build

# Then in the RN project directory, re-install to pick up the new dist:
cd your-rn-app
yarn install --force

# Reload the app on the device (shake → Reload, or press 'r' in Metro)
```

### Quick rebuild script

To speed up the cycle, add this script to the **table-tamer** root `package.json`:

```json
{
  "scripts": {
    "dev:sync": "pnpm build && cd ../your-rn-app && yarn install --force"
  }
}
```

Then just run `pnpm dev:sync` after every change.

### Watching for changes

For the desktop app UI, you can use the Vite dev server with hot reload:

```bash
# Terminal 1: Vite dev server (hot reload for renderer)
cd table-tamer/packages/app
pnpm dev:renderer

# Terminal 2: Electron (needs manual restart for main process changes)
cd table-tamer/packages/app
pnpm dev
```

For the client library, use watch mode:

```bash
# Auto-rebuild on changes
cd table-tamer/packages/client
pnpm dev  # runs tsup --watch
```

> **Note**: Even with `tsup --watch`, you still need to run `yarn install --force` in the RN project to copy the updated dist.

### Android physical device

Don't forget to forward the port every time you reconnect the device:

```bash
adb reverse tcp:8765 tcp:8765
```

Add it to your RN project's scripts for convenience:

```json
{
  "scripts": {
    "table-tamer": "adb reverse tcp:8765 tcp:8765"
  }
}
```

### Common gotchas

| Issue | Solution |
|-------|----------|
| Changes not reflected in RN app | Run `yarn install --force` in your RN project after rebuilding |
| Metro serves stale bundle | Restart Metro with `--reset-cache` |
| `Cannot find module '@table-tamer/client'` | Run `yarn install` in your RN project |
| Desktop app doesn't start | Run `pnpm build` first (the `dev` script needs compiled main process) |
| `adb reverse` lost after device reconnect | Re-run `adb reverse tcp:8765 tcp:8765` |
| Electron main process changes not applied | Quit and restart the desktop app (`Cmd+Q`, then `pnpm --filter @table-tamer/app dev`) |
| Core type changes not in client | Rebuild core first: `pnpm --filter @table-tamer/core build`, then client |

### Project structure for contributors

```
table-tamer/
├── packages/
│   ├── core/           # Shared types & protocol — rebuild first
│   │   └── src/
│   │       ├── protocol.ts    # Message types, actions
│   │       └── constants.ts   # Port, limits
│   │
│   ├── client/         # RN client library — rebuild after core
│   │   └── src/
│   │       ├── TableTamerClient.ts   # connectInspector() entry point
│   │       ├── connection.ts         # WebSocket with auto-reconnect
│   │       └── handlers/             # One handler per action
│   │
│   ├── app/            # Electron desktop app
│   │   └── src/
│   │       ├── main/          # Electron main process (Node.js)
│   │       │   ├── main.ts    # Window, lifecycle
│   │       │   ├── wsServer.ts # WebSocket server
│   │       │   └── preload.ts  # IPC bridge
│   │       └── renderer/       # React frontend (Vite)
│   │           ├── App.tsx
│   │           ├── components/
│   │           ├── hooks/
│   │           └── stores/
│   │
│   └── table-tamer/    # Unified npm wrapper package
│       └── src/
│           └── index.ts  # Re-exports from client
```

### Build order

Packages must be built in dependency order:

```bash
# 1. Core first (no dependencies)
pnpm --filter @table-tamer/core build

# 2. Client depends on core
pnpm --filter @table-tamer/client build

# 3. App depends on core
pnpm --filter @table-tamer/app build

# 4. Wrapper depends on core + client
pnpm --filter table-tamer build

# Or just build everything (Turborepo handles the order):
pnpm build
```

## Troubleshooting

### "No devices" in desktop app
- Check that the RN app is running in dev mode (`__DEV__` must be true)
- For Android physical devices, ensure `adb reverse tcp:8765 tcp:8765` was run
- Check Metro logs for `[TableTamer] Connected to desktop app`

### "WebSocket onerror: Failed to connect"
- Ensure the desktop app is running first
- Check that port 8765 is not blocked by a firewall
- For Android: re-run `adb reverse tcp:8765 tcp:8765`

### Updates/deletes not working
- Ensure you're using WatermelonDB v0.26+ with the SQLite adapter
- The app uses `CompatAdapter.unsafeExecute` which requires the adapter to support `unsafeExecuteMultiple`

### App crashes on connect
- Check that your WatermelonDB instance is fully initialized before calling `connectInspector`
- Try placing the import after the database is created (not at the top-level)
