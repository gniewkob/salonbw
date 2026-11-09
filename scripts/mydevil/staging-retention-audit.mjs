#!/usr/bin/env node
/**
 * SalonBW DEV recovery audit. Read-only by construction: no prune, delete,
 * finalize, rename, copy or remote access. Node.js 22+, no dependencies.
 * The report never exposes snapshot manifest contents, filenames or secrets.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TARGETS = Object.freeze({
  panelbw_dev: { kind: 'frontend', parts: ['app.js', 'app.cjs', 'node_modules', '.next', 'public', 'package.json', 'next.config.mjs', 'packages', 'src', 'scripts', '.env.runtime.json', '.env', '.env.production', '.env.local', '.env.production.local', 'package-lock.json', 'npm-shrinkwrap.json'] },
  salonbw: { kind: 'frontend', parts: ['app.js', 'app.cjs', 'node_modules', '.next', 'public', 'package.json', 'next.config.mjs', 'packages', 'src', 'scripts', '.env.runtime.json', '.env', '.env.production', '.env.local', '.env.production.local', 'package-lock.json', 'npm-shrinkwrap.json'] },
  api_salonbw_dev: { kind: 'api', parts: ['dist', 'node_modules', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'app.js', 'app.cjs', '.env', '.env.generated'] },
});
const TOKEN = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_ITEMS = 1_000_000;
const BYTES_PER_BLOCK = 512;

function failure(code) { const error = new Error(code); error.code = code; return error; }
function contained(root, entry) { return entry === root || entry.startsWith(root + path.sep); }
async function statDirect(file) {
  try { return await fs.lstat(file); } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw failure('METADATA_UNREADABLE');
  }
}
async function directoryNoLinks(p) {
  const segments = path.resolve(p).split(path.sep).filter(Boolean);
  let current = path.parse(p).root;
  for (const segment of segments) {
    current = path.join(current, segment);
    const stat = await statDirect(current);
    if (!stat?.isDirectory() || stat.isSymbolicLink()) throw failure('UNSAFE_DIRECTORY_CHAIN');
  }
}
async function exactMarker(snapshot, name, maxBytes = 4096) {
  const file = path.join(snapshot, name);
  const stat = await statDirect(file);
  if (!stat?.isFile() || stat.isSymbolicLink() || stat.size > maxBytes) throw failure('INVALID_MARKER');
  try { return await fs.readFile(file, 'utf8'); }
  catch { throw failure('MARKER_UNREADABLE'); }
}
async function strictChildren(dir) {
  const result = [];
  try {
    for await (const item of await fs.opendir(dir)) result.push(item.name);
  } catch { throw failure('DIRECTORY_UNREADABLE'); }
  return result;
}

/** Counts disk allocation approximately. Never follows symbolic links. */
async function inspectTree(root, boundary, deep, maxItems = MAX_ITEMS) {
  const work = [root];
  const seen = new Set();
  let visited = 0, symlinks = 0, allocatedBytes = 0;
  const issues = new Set();
  while (work.length) {
    const item = work.pop();
    if (++visited > maxItems) { issues.add('METADATA_SCAN_LIMIT'); break; }
    const st = await statDirect(item);
    if (!st) { issues.add('MISSING_CONTENT'); continue; }
    const inode = `${st.dev}:${st.ino}`;
    if (!seen.has(inode)) { allocatedBytes += (st.blocks ?? 0) * BYTES_PER_BLOCK; seen.add(inode); }
    if (st.isSymbolicLink()) {
      symlinks++;
      let link;
      try { link = await fs.readlink(item); } catch { issues.add('SYMLINK_UNREADABLE'); continue; }
      // Absolute links and targets outside the immutable snapshot are unsafe.
      if (path.isAbsolute(link) || !contained(boundary, path.resolve(path.dirname(item), link))) {
        issues.add('UNSAFE_SYMLINK'); continue;
      }
      try {
        const resolved = await fs.realpath(item);
        if (!contained(boundary, resolved)) issues.add('UNSAFE_SYMLINK');
      } catch { issues.add('DANGLING_SYMLINK'); }
      continue;
    }
    if (!st.isDirectory()) continue;
    if (!deep && item !== root) continue;
    const children = await strictChildren(item);
    for (const name of children) work.push(path.join(item, name));
  }
  return { visited, symlinks, allocatedBytes, issues: [...issues].sort() };
}

async function inspectSnapshot(snapshot, app, deep, maxItems) {
  const { kind, parts } = TARGETS[app];
  const issues = new Set();
  const markerNames = new Set(['READY', 'present', 'kind', 'destination', 'files']);
  let entries = 0, symlinks = 0, allocatedBytes = 0, visited = 0;
  try {
    const st = await statDirect(snapshot);
    if (!st?.isDirectory() || st.isSymbolicLink()) throw failure('UNSAFE_SNAPSHOT_DIRECTORY');
    const names = await strictChildren(snapshot);
    if (names.some(name => !markerNames.has(name))) issues.add('UNEXPECTED_SNAPSHOT_ELEMENT');
    const ready = await statDirect(path.join(snapshot, 'READY'));
    if (!ready?.isFile() || ready.isSymbolicLink()) throw failure('READY_INVALID');
    const actualKind = await exactMarker(snapshot, 'kind');
    const actualDest = await exactMarker(snapshot, 'destination');
    const home = path.dirname(path.dirname(path.dirname(path.dirname(snapshot))));
    const expectedDest = path.join(home, 'apps', 'nodejs', app);
    if (actualKind !== `${kind}\n` || actualDest !== `${expectedDest}\n`) issues.add('IDENTITY_MISMATCH');
    const raw = await exactMarker(snapshot, 'present');
    if (!raw.endsWith('\n') || raw.includes('\r') || raw.includes('\0')) issues.add('MANIFEST_FORMAT');
    const present = raw.split('\n').slice(0, -1);
    entries = present.length;
    const listed = new Set();
    const allowed = new Set(parts);
    for (const entry of present) {
      if (!allowed.has(entry)) issues.add('UNEXPECTED_MANIFEST_ENTRY');
      if (listed.has(entry)) issues.add('DUPLICATE_MANIFEST_ENTRY');
      listed.add(entry);
    }
    if (!entries) issues.add('EMPTY_MANIFEST');
    const files = path.join(snapshot, 'files');
    const filesStat = await statDirect(files);
    if (!filesStat?.isDirectory() || filesStat.isSymbolicLink()) throw failure('UNSAFE_FILES_DIRECTORY');
    const existing = await strictChildren(files);
    for (const entry of present) {
      if (allowed.has(entry) && !existing.includes(entry)) issues.add('MISSING_DECLARED_ELEMENT');
    }
    for (const entry of existing) {
      if (!listed.has(entry)) issues.add('UNDECLARED_ELEMENT');
    }
    // For isolated unit tests and regular runs: no mutation, no content reads.
    // A deep walk is opt-in to minimize I/O on the shared 3 GiB MyDevil host.
    for (const entry of existing) {
      const actual = path.join(files, entry);
      const scan = await inspectTree(actual, files, deep, maxItems);
      visited += scan.visited;
      symlinks += scan.symlinks;
      allocatedBytes += scan.allocatedBytes;
      for (const reason of scan.issues) issues.add(reason);
    }
  } catch (e) { issues.add(e.code ?? 'AUDIT_UNAVAILABLE'); }
  return { valid: issues.size === 0, manifestEntries: entries, inspectedNodes: visited,
    symlinkCount: symlinks, estimatedAllocatedBytes: allocatedBytes, findings: [...issues].sort() };
}

export async function audit({ home = '/usr/home/vetternkraft', app = 'panelbw_dev',
  protectedIds = [], candidateIds = [], deep = false, maxItems = MAX_ITEMS } = {}) {
  if (!Object.hasOwn(TARGETS, app)) throw failure('UNKNOWN_DEV_APPLICATION');
  if (!path.isAbsolute(home) || path.normalize(home) !== home || home === path.parse(home).root) throw failure('UNSAFE_ACCOUNT_ROOT');
  for (const id of [...protectedIds, ...candidateIds]) if (!TOKEN.test(id)) throw failure('INVALID_TOKEN');
  if (new Set(protectedIds).size !== protectedIds.length || new Set(candidateIds).size !== candidateIds.length) throw failure('DUPLICATE_INPUT_TOKEN');
  if (!Number.isSafeInteger(maxItems) || maxItems < 1 || maxItems > MAX_ITEMS) throw failure('INVALID_SCAN_LIMIT');
  const recovery = path.join(home, '.deployment-private', 'staging-rollback', app);
  await directoryNoLinks(recovery);
  const names = await strictChildren(recovery);
  const pending = names.filter(name => name.startsWith('.pending-'));
  const unexpected = names.filter(name => !name.startsWith('.pending-') && !TOKEN.test(name));
  const tokens = names.filter(name => TOKEN.test(name)).sort();
  const all = new Set(tokens);
  if ([...protectedIds, ...candidateIds].some(id => !all.has(id))) throw failure('UNKNOWN_INPUT_TOKEN');
  const protectedSet = new Set(protectedIds);
  const candidateSet = new Set(candidateIds);
  const snapshots = [];
  for (const id of tokens) {
    const scan = await inspectSnapshot(path.join(recovery, id), app, deep, maxItems);
    snapshots.push({ id, ...scan, protected: protectedSet.has(id),
      candidateRequested: candidateSet.has(id),
      decision: protectedSet.has(id) ? 'PROTECT' : candidateSet.has(id) ? 'BLOCKED_PENDING_RESTORE_AND_APPROVAL' : 'UNCLASSIFIED_KEEP' });
  }
  const findings = [];
  if (pending.length) findings.push('PENDING_DEPLOYMENT_ENTRIES');
  if (unexpected.length) findings.push('UNEXPECTED_RECOVERY_ENTRIES');
  if (snapshots.some(item => !item.valid)) findings.push('INVALID_SNAPSHOT_METADATA');
  return { schema: 1, app, mode: deep ? 'DEEP_READ_ONLY' : 'MANIFEST_READ_ONLY',
    deletionCapability: false, hostConcurrencyGate: 'NOT_VERIFIED', offHostRestoreGate: 'NOT_VERIFIED',
    total: snapshots.length, valid: snapshots.filter(s => s.valid).length,
    pendingCount: pending.length, unexpectedEntryCount: unexpected.length,
    candidateCount: candidateIds.length, eligibleForDeletion: 0,
    nominalCandidateBytes: deep ? snapshots.filter(s => s.candidateRequested && s.valid && !s.protected).reduce((sum, s) => sum + s.estimatedAllocatedBytes, 0) : null,
    findings, snapshots };
}

function parseArgs(args) {
  const opts = { protectedIds: [], candidateIds: [] };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--deep') { opts.deep = true; continue; }
    if (key === '--home' || key === '--app' || key === '--protect' || key === '--candidate') {
      const val = args[++i];
      if (!val || val.startsWith('--')) throw failure('INVALID_ARGUMENT');
      if (key === '--home') opts.home = val;
      if (key === '--app') opts.app = val;
      if (key === '--protect') opts.protectedIds.push(val);
      if (key === '--candidate') opts.candidateIds.push(val);
      continue;
    }
    throw failure('INVALID_ARGUMENT');
  }
  return opts;
}

if (process.argv[1] === '-' || (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)) {
  try {
    const report = await audit(parseArgs(process.argv.slice(2)));
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    if (report.findings.length) process.exitCode = 3;
  } catch (e) {
    // Never print paths, manifest contents, or raw FS errors to stderr.
    process.stderr.write(`RETENTION_AUDIT_BLOCKED: ${e.code ?? 'UNEXPECTED_FAILURE'}\n`);
    process.exitCode = 2;
  }
}
