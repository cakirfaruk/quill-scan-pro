#!/usr/bin/env node
/**
 * purge-stale-chunks.js
 *
 * Run this after `vite build` to remove any leftover JS/CSS chunks from
 * previous builds that are no longer referenced by the new manifest.
 *
 * Usage:
 *   node scripts/purge-stale-chunks.js          # dry-run (default)
 *   node scripts/purge-stale-chunks.js --delete  # actually delete files
 *
 * This prevents browsers that load the NEW index.html from trying to fetch
 * OLD hashed chunk URLs that are no longer present on the server.
 *
 * How it works:
 *  1. Read Vite's manifest.json to find all chunks referenced by the build.
 *  2. Scan the assets directory for all .js / .css files.
 *  3. Delete any file not listed in the manifest (these are orphaned chunks).
 */

import { readFileSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, basename } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const ASSETS_DIR = join(DIST_DIR, 'assets');
const MANIFEST_PATH = join(DIST_DIR, '.vite', 'manifest.json');
const DRY_RUN = !process.argv.includes('--delete');

function main() {
  // 1. Load the Vite manifest
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    console.error('[purge-stale-chunks] manifest.json not found — run `vite build` first.');
    process.exit(1);
  }

  // 2. Collect all chunk filenames referenced by the manifest
  const referencedFiles = new Set();
  for (const entry of Object.values(manifest)) {
    if (entry.file) referencedFiles.add(basename(entry.file));
    for (const css of entry.css ?? []) referencedFiles.add(basename(css));
    for (const asset of entry.assets ?? []) referencedFiles.add(basename(asset));
    for (const chunk of entry.imports ?? []) referencedFiles.add(basename(chunk));
  }

  // 3. Scan assets dir and delete orphans
  let scanned = 0;
  let purged = 0;

  for (const file of readdirSync(ASSETS_DIR)) {
    if (!/\.(js|css|mjs)$/.test(file)) continue;
    scanned++;
    if (!referencedFiles.has(file)) {
      const fullPath = join(ASSETS_DIR, file);
      if (DRY_RUN) {
        console.log(`[DRY-RUN] Would delete: assets/${file}`);
      } else {
        unlinkSync(fullPath);
        console.log(`[PURGED] assets/${file}`);
      }
      purged++;
    }
  }

  console.log(
    `\n[purge-stale-chunks] Scanned ${scanned} files, ${purged} orphan(s) ${DRY_RUN ? 'found (dry-run)' : 'deleted'}.`
  );
  if (DRY_RUN && purged > 0) {
    console.log('Run with --delete to actually remove them.\n');
  }
}

main();
