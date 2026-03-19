#!/usr/bin/env node

/**
 * Syncs the version from root package.json to all sub-packages.
 * Called by release-it after bumping the root version.
 *
 * Usage: node scripts/sync-versions.mjs <version>
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/sync-versions.mjs <version>');
  process.exit(1);
}

const packages = [
  'packages/core/package.json',
  'packages/client/package.json',
  'packages/app/package.json',
  'packages/table-tamer/package.json',
];

for (const pkgPath of packages) {
  const fullPath = join(__dirname, '..', pkgPath);
  try {
    const pkg = JSON.parse(readFileSync(fullPath, 'utf-8'));
    const oldVersion = pkg.version;
    pkg.version = version;
    writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ${pkgPath}: ${oldVersion} → ${version}`);
  } catch (err) {
    console.warn(`  Warning: Could not update ${pkgPath}:`, err.message);
  }
}

console.log(`\n✓ All packages synced to v${version}`);
