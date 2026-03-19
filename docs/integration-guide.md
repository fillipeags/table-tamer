# Table Tamer Integration Guide

This guide explains how to integrate Table Tamer into your React Native project that uses WatermelonDB.

## Prerequisites

- React Native 0.70+
- WatermelonDB 0.26+ (0.28 recommended)
- A WatermelonDB `Database` instance in your app

## Step 1: Install packages

```bash
yarn add @table-tamer/client @table-tamer/core
```

Or with npm:

```bash
npm install @table-tamer/client @table-tamer/core
```

> **Note**: These are dev-only dependencies. The client automatically only connects in `__DEV__` mode.

## Step 2: Create configuration file

Create `src/config/TableTamerConfig.ts` (or `.js`):

```typescript
import { Platform } from 'react-native';

if (__DEV__) {
  // Lazy require to avoid bundling in production
  const { connectInspector } = require('@table-tamer/client');

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
