# Table Tamer Roadmap

This document tracks pending improvements, known issues, and planned features.

## Critical / Blocking

### npm Publish — Create @table-tamer org
- **Status**: Blocked
- **Issue**: Scoped packages (`@table-tamer/core`, `@table-tamer/client`) require the `table-tamer` organization to exist on npmjs.com
- **Fix**: Go to https://www.npmjs.com/org/create → create org `table-tamer` → add yourself as owner
- **Alternative**: Rename packages to unscoped names (e.g., `table-tamer-core`, `table-tamer-client`)

### macOS DMG "damaged" error
- **Status**: ✅ Done
- **Fix**: Configured code signing (hardened runtime + entitlements) and notarization via electron-builder's built-in support. GitHub Secrets: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`

## CI/CD Improvements

### Upgrade actions/checkout to v5
- **Status**: Planned
- **Issue**: `actions/checkout@v4` shows Node 20 deprecation warning
- **Fix**: Update to `actions/checkout@v5` once released, or pin `actions/checkout@v4` which will auto-migrate

### Windows code signing
- **Status**: Planned
- **Issue**: Windows shows SmartScreen warning for unsigned executables
- **Fix**: Purchase an EV code signing certificate and configure in electron-builder

### Lockfile sync after release-it bump
- **Status**: ✅ Done
- **Fix**: Added `pnpm install --no-frozen-lockfile` to the `after:bump` hook in `.release-it.json`

### Separate npm publish from binary builds
- **Status**: ✅ Done
- **Fix**: `publish-npm` now depends only on `create-release`, not `build-binaries`

## Feature Improvements

### Data Grid
- [ ] Column sorting — click header to sort ASC/DESC
- [ ] Column filtering — filter by value, contains, null/not-null
- [ ] Column resizing — drag column borders to resize
- [ ] Export to CSV/JSON — export current view or query results
- [ ] Cell copy — click to copy cell value to clipboard
- [ ] Keyboard navigation — arrow keys to navigate cells

### SQL Console
- [ ] Syntax highlighting — integrate CodeMirror 6 for SQL highlighting
- [ ] Auto-complete — table names, column names
- [ ] Multi-statement execution — run multiple queries separated by `;`
- [ ] Query explain/plan — show EXPLAIN output for query optimization

### Schema Graph
- [ ] Show column details on node hover/click
- [ ] Auto-layout algorithm (e.g., dagre/elk) for better positioning
- [ ] Highlight related tables on node selection
- [ ] Show relationship cardinality (1:1, 1:N, N:M)
- [ ] Filter/search nodes

### Desktop App
- [ ] Multiple simultaneous device connections with tab-per-device
- [ ] Diff view — compare data between two snapshots
- [ ] Activity log — record all update/delete operations with undo capability
- [ ] Data import — import CSV/JSON into tables
- [ ] Favorites — pin frequently accessed tables to the top of the sidebar
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts (Cmd+K command palette, Cmd+S save query, etc.)

### Client Library
- [ ] Support for Realm database
- [ ] Support for expo-sqlite
- [ ] Support for TypeORM
- [ ] Reactotron plugin mode (embed as a Reactotron plugin instead of standalone)
- [x] Connection status events (`onConnect`, `onDisconnect` callbacks in `connectInspector`)

## Performance

- [ ] Virtual scrolling for large datasets (>10k rows)
- [ ] Lazy loading for schema graph (load schemas on demand, not all at once)
- [ ] WebSocket message compression for large result sets
- [ ] Debounce schema fetches to avoid hammering the device on connect

## Security

- [x] Read-only mode — `readOnly: true` option blocks all write operations
- [ ] Connection authentication — optional token/password to prevent unauthorized access
- [x] SQL injection prevention — parameterized queries for update/delete handlers

## Documentation

- [ ] Video tutorial — screen recording of setup + usage flow
- [ ] Architecture deep-dive — explain the WebSocket protocol and adapter patterns
- [ ] Troubleshooting guide expansion — add more common issues and solutions
- [ ] Changelog automation — ensure CHANGELOG.md is properly generated on each release
