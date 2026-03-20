# Table Tamer

<p align="center">
  <img src="tableTamer.png" width="128" alt="Table Tamer" />
</p>

<p align="center">
  <strong>A real-time WatermelonDB/SQLite inspector for React Native apps</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#downloads">Downloads</a>
</p>

<p align="center">
  <a href="https://github.com/fillipeags/table-tamer/actions/workflows/ci.yml"><img src="https://github.com/fillipeags/table-tamer/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/fillipeags/table-tamer/actions/workflows/release.yml"><img src="https://github.com/fillipeags/table-tamer/actions/workflows/release.yml/badge.svg" alt="Release" /></a>
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Coverage" />
  <a href="https://www.npmjs.com/package/@table-tamer/react-native"><img src="https://img.shields.io/npm/v/@table-tamer/react-native.svg" alt="npm version" /></a>
  <a href="https://github.com/fillipeags/table-tamer/releases/latest"><img src="https://img.shields.io/github/v/release/fillipeags/table-tamer" alt="GitHub Release" /></a>
  <a href="https://github.com/fillipeags/table-tamer/blob/main/LICENSE"><img src="https://img.shields.io/github/license/fillipeags/table-tamer" alt="License" /></a>
</p>

---

Table Tamer is an open-source developer tool for inspecting and modifying WatermelonDB/SQLite databases in React Native applications in real time. Think of it as a Beekeeper Studio / Flipper replacement specifically designed for WatermelonDB.

## Features

- **Real-time database inspection** — Browse all tables, view records with pagination, and inspect schema
- **SQL Console** — Execute arbitrary SQL queries with syntax highlighting and result display
- **Inline editing** — Double-click any cell to edit values directly with confirmation dialogs
- **Bulk operations** — Multi-select rows for bulk delete with confirmation
- **Schema graph** — Visualize table relationships with an interactive graph view (powered by ReactFlow)
- **Saved queries** — Save, import, and export frequently used queries in JSON format
- **Theme customization** — Built-in theme presets and custom color picker
- **Auto-reconnect** — Resilient WebSocket connection with automatic reconnection
- **Cross-platform** — Desktop app runs on macOS, Windows, and Linux

## How It Works

```
[React Native App] <--WatermelonDB APIs--> [Client Library] <--WebSocket--> [Desktop App (Electron)]
```

- The **Desktop app** (Electron) starts a WebSocket server on port 8765
- The **Client library** (in your RN app) connects as a WebSocket client
- The desktop app sends requests (e.g., "list tables"), the client executes via WatermelonDB APIs and returns responses

## Downloads

Download the latest release from the [Releases page](https://github.com/fillipeags/table-tamer/releases).

| Platform | Format |
|----------|--------|
| macOS | `.dmg` |
| Windows | `.exe` (installer) |
| Linux | `.deb`, `.AppImage` |

## Installation

### 1. Install the client library in your React Native project

```bash
# npm
npm install @table-tamer/react-native

# yarn
yarn add @table-tamer/react-native

# pnpm
pnpm add @table-tamer/react-native
```

### 2. Configure the client

Create a configuration file (e.g., `src/config/TableTamerConfig.ts`):

```typescript
import { Platform } from 'react-native';

if (__DEV__) {
  const { connectInspector } = require('@table-tamer/react-native');
  const wmdb = require('./path/to/your/watermelondb-instance').default;

  connectInspector({
    database: wmdb,
    appName: 'my-app',
    appVersion: '1.0.0',
    platform: Platform.OS,
  });
}
```

### 3. Import in your app entry point

```javascript
// index.js
if (__DEV__) {
  require('./src/config/TableTamerConfig');
}
```

### 4. Platform-specific setup

**iOS (physical devices):** Works automatically — the client detects your Mac's IP from the Metro bundler. No extra configuration needed.

If auto-detection doesn't work, you can set the host manually:

```typescript
connectInspector({
  database: wmdb,
  host: '192.168.0.100', // your Mac's local IP
});
```

**Android (physical devices):** Forward the port via ADB:

```bash
adb reverse tcp:8765 tcp:8765
```

**Simulators/Emulators:** Work out of the box with `localhost`.

### 5. Launch Table Tamer desktop app

Download from [Releases](https://github.com/fillipeags/table-tamer/releases) or build from source:

```bash
git clone https://github.com/fillipeags/table-tamer.git
cd table-tamer
pnpm install
pnpm build
pnpm --filter @table-tamer/app dev
```

## Architecture

### Monorepo Structure

```
table-tamer/
├── packages/
│   ├── core/       # @table-tamer/core — Protocol types, constants
│   ├── client/     # @table-tamer/client — RN client library
│   └── app/        # @table-tamer/app — Electron desktop app
├── .github/
│   └── workflows/  # CI/CD pipelines
└── ...
```

### Protocol

Communication uses a simple JSON-over-WebSocket protocol:

| Action | Direction | Description |
|--------|-----------|-------------|
| `get_database_info` | Server → Client | Database name, schema version, table count |
| `get_table_list` | Server → Client | All tables with record counts |
| `get_table_data` | Server → Client | Paginated table data |
| `get_schema` | Server → Client | Column definitions for a table |
| `execute_sql` | Server → Client | Execute arbitrary SQL |
| `update_record` | Server → Client | Update a single cell value |
| `delete_records` | Server → Client | Delete rows by ID |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 35, React 19, Vite 6, Tailwind CSS 4 |
| State | Zustand |
| Data Grid | Custom (no heavy dependencies) |
| Graph View | ReactFlow |
| WebSocket | `ws` (server), native WebSocket (client) |
| Build | pnpm, Turborepo, tsup, electron-builder |

## Client API

### `connectInspector(options)`

Connects to the Table Tamer desktop app.

```typescript
interface ConnectInspectorOptions {
  database: Database;      // WatermelonDB Database instance
  appName?: string;        // App name shown in desktop app
  appVersion?: string;     // App version shown in desktop app
  platform?: string;       // 'ios' | 'android'
  host?: string;           // WebSocket host (auto-detected from Metro bundler)
  port?: number;           // WebSocket port (default: 8765)
  readOnly?: boolean;      // Block all write operations (default: false)
  onConnect?: () => void;  // Called when connection is established
  onDisconnect?: () => void; // Called when connection is lost
}
```

### `disconnectInspector()`

Disconnects from the desktop app.

## Compatibility

- **WatermelonDB**: v0.26+ (tested with v0.28)
- **React Native**: 0.70+ (tested with 0.79)
- **Platforms**: iOS, Android
- **Desktop**: macOS, Windows, Linux

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run desktop app in dev mode
pnpm --filter @table-tamer/app dev

# Lint
pnpm lint

# Build distributables
pnpm dist:mac    # macOS .dmg
pnpm dist:win    # Windows .exe
pnpm dist:linux  # Linux .deb / .AppImage
```

### Tests

Tests are written with [Vitest](https://vitest.dev/) and cover the `core`, `client`, and `table-tamer` packages.

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run tests for a specific package
pnpm --filter @table-tamer/core test
```

Test files live in `src/__tests__/` within each package.

### Testing with a React Native app

Use [yalc](https://github.com/wclr/yalc) to link local packages to your RN project:

```bash
# 1. Install yalc globally
npm install -g yalc

# 2. In the table-tamer repo, build and publish all packages to the local store
pnpm build
cd packages/core && yalc publish && cd ../..
cd packages/client && yalc publish && cd ../..
cd packages/table-tamer && yalc publish && cd ../..

# 3. In your RN project, add the local packages
cd your-rn-app
yalc add @table-tamer/core
yalc add @table-tamer/client
yalc add @table-tamer/react-native

# 4. After making changes to table-tamer, rebuild and push updates
cd table-tamer
pnpm build
cd packages/core && yalc publish && cd ../..
cd packages/client && yalc publish && cd ../..
cd packages/table-tamer && yalc publish --push && cd ../..
# --push automatically updates all linked projects

# 5. Rebuild the RN app (native rebuild required since it's in node_modules)
cd your-rn-app && yarn ios  # or yarn android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT - see [LICENSE](LICENSE) for details.
