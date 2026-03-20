# Table Tamer

Real-time WatermelonDB/SQLite inspector for React Native apps. Desktop app (Electron) connects to RN apps via WebSocket to browse, edit, and query databases.

## Architecture

pnpm monorepo with Turborepo orchestration. Four packages:

- `packages/core` — `@table-tamer/core`: Protocol types, constants, message envelopes (no internal deps)
- `packages/client` — `@table-tamer/client`: React Native client library (depends on core)
- `packages/app` — `@table-tamer/app`: Electron desktop app with React UI (depends on core, private)
- `packages/table-tamer` — `@table-tamer/react-native`: Convenience wrapper re-exporting client + core

Dependency order: core → client → app, core → table-tamer ← client

## Tech Stack

- **Language:** TypeScript 5.8 (strict mode, ES2022 target)
- **Desktop:** Electron 35 + React 19 + Vite 6 + Tailwind CSS 4
- **State:** Zustand 5
- **Data grid:** TanStack React Table 8
- **Graph:** ReactFlow 12
- **SQL editor:** CodeMirror 6
- **WebSocket:** ws 8 (server in Electron main process, port 8765)
- **Library bundler:** tsup (ESM + CJS dual output)
- **Package manager:** pnpm 9.15.0

## Commands

```bash
pnpm install                          # Install all dependencies
pnpm build                            # Build all packages (via Turborepo)
pnpm dev                              # Dev mode for all packages
pnpm --filter @table-tamer/app dev    # Dev mode for desktop app only
pnpm lint                             # ESLint check
pnpm lint:fix                         # ESLint auto-fix
pnpm clean                            # Clean all dist/ outputs
pnpm release:patch                    # Release patch version
pnpm release:minor                    # Release minor version
pnpm dist:mac                         # Build macOS distributable
pnpm dist:win                         # Build Windows distributable
pnpm dist:linux                       # Build Linux distributable
```

## Code Conventions

- **Components:** PascalCase filenames (`TableDataGrid.tsx`, `RecordDetailDialog.tsx`)
- **Stores:** camelCase + `Store` suffix (`appStore.ts`, `settingsStore.ts`)
- **Hooks:** `use` prefix (`useAppStore.ts`, `useConnections.ts`)
- **Handlers:** `handle` prefix (`handleGetDatabaseInfo.ts`, `handleExecuteSql.ts`)
- **Type imports:** Always use `import type { ... }` for type-only imports
- **Unused vars:** Prefix with `_` (ESLint configured to allow `_`-prefixed args)
- **`any` type:** Allowed (ESLint rule is off)
- **Workspace deps:** Use `workspace:*` for internal package references

## Connection

- **Host auto-detection:** The client extracts the Mac's IP from Metro bundler's `scriptURL` via `NativeModules.SourceCode` — works automatically on iOS physical devices
- **Fallback:** Defaults to `localhost` (simulators, Android with `adb reverse`)
- **Manual override:** Users can pass `host` option to `connectInspector()` if auto-detection fails

## Protocol

Message-based communication over WebSocket:

- All messages extend `MessageEnvelope` with `version`, `id`, `timestamp`
- Union type: `Message = HandshakeMessage | RequestMessage | ResponseMessage`
- Request/response correlation via `requestId`
- Error responses checked with `isErrorResponse()` type guard
- UUID generation uses `crypto.randomUUID()` with React Native fallback

## Release Process

Uses `release-it` with Angular conventional changelog preset. The release pipeline:

1. Runs `pnpm lint`
2. Bumps version in root `package.json`
3. Runs `scripts/sync-versions.mjs` to sync all sub-package versions
4. Builds all packages
5. Commits, tags, and pushes

## CI

- Node 22, pnpm 9
- PR checks: lint + build + multi-platform binary builds
- Release: triggered by tag push (`v*`)
- Pre-commit hook (Husky): runs `pnpm lint`

## Tests

Uses Vitest with workspace support. Tests cover `core`, `client`, and `table-tamer` packages (app is excluded).

```bash
pnpm test                             # Run all tests
pnpm test:watch                       # Watch mode
pnpm --filter @table-tamer/core test  # Run tests for a specific package
```

Test files live in `src/__tests__/` within each package.

## Security

- **Parameterized queries:** `updateRecord` and `deleteRecords` handlers use `?` placeholders instead of string interpolation to prevent SQL injection
- **Read-only mode:** Pass `readOnly: true` to `connectInspector()` to block all write operations (update, delete, write SQL)
- **SQL console:** `execute_sql` in read-only mode only allows SELECT, PRAGMA, and EXPLAIN

## Post-Development Checklist

After finishing any feature, bugfix, or refactor, always:

1. **Run tests:** `pnpm build && pnpm test` — fix any failures
2. **Check coverage:** `pnpm test:coverage` — add tests for new/changed code, maintain 100%
3. **Run lint:** `pnpm lint` — fix any new errors (pre-existing app warnings are ok)
4. **Check for regressions:** Review existing tests that touch modified modules
5. **Update docs:** If the change affects public API, update README.md, CLAUDE.md, and docs/
6. **Update roadmap:** If the change resolves a roadmap item, mark it as done in `docs/roadmap/README.md`
