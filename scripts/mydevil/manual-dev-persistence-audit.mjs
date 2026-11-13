// Read-only DEV panel persistence inventory. Run with Node 22 on MyDevil.
// Does not list filenames, read file contents (except source SHA receipt),
// traverse symlinks, or write to the live application.
import fs from 'node:fs';
import path from 'node:path';

const fail = (reason) => {
    console.error('DEV_PERSISTENCE_AUDIT=BLOCKED reason=' + reason);
    process.exit(1);
};

const sha = process.argv.at(-2);
const target = process.argv.at(-1);
if (!/^[a-f0-9]{40}$/.test(sha || '') || target !== 'panel') {
    fail('invalid-arguments');
}
const home = process.env.HOME;
if (!home || !path.isAbsolute(home)) fail('invalid-home');

const live = path.join(home, 'apps/nodejs/panelbw_dev');
const sourceRoot = path.join(home, '.salonbw-manual/sources', sha);
const sourcePanel = path.join(sourceRoot, 'apps/panel');
const domain = path.join(home, 'domains/dev-panel.salon-bw.pl/public_nodejs');

const stat = (p) => {
    try {
        return fs.lstatSync(p);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        fail('filesystem-inspection-failed');
    }
};
const realDirectory = (p) => {
    const s = stat(p);
    return !!s && s.isDirectory() && !s.isSymbolicLink();
};
if (!realDirectory(live) || !realDirectory(sourceRoot) ||
    !realDirectory(sourcePanel)) fail('unexpected-app-or-source-path');
const linkStat = stat(domain);
if (!linkStat?.isSymbolicLink()) fail('domain-symlink-missing');
try {
    if (fs.realpathSync(domain) !== fs.realpathSync(live)) {
        fail('domain-app-target-mismatch');
    }
} catch {
    fail('domain-realpath-failed');
}
const receiptFile = path.join(sourceRoot, '.salonbw-source-sha');
const receiptStat = stat(receiptFile);
if (!receiptStat?.isFile() || receiptStat.isSymbolicLink() ||
    receiptStat.size > 100) fail('source-receipt-missing');
if (fs.readFileSync(receiptFile, 'utf8').trim() !== sha) {
    fail('source-receipt-mismatch');
}
if (!realDirectory(path.join(live, 'public')) ||
    !realDirectory(path.join(sourcePanel, 'public'))) {
    fail('public-directory-missing');
}

// Labels are intentionally fixed: no raw filename, symlink destination,
// private environment variable, or source line is sent to stdout.
const candidates = [
    ['tmp', 'tmp'],
    ['diagnostics', '.diagnostics'],
    ['logs', 'logs'],
    ['storage', 'storage'],
    ['uploads', 'uploads'],
    ['data', 'data'],
    ['files', 'files'],
    ['cache', 'cache'],
    ['next_cache', '.next/cache'],
    ['public_uploads', 'public/uploads'],
    ['public_media', 'public/media'],
    ['public_files', 'public/files'],
    ['public_next', 'public/_next'],
    ['env_runtime', '.env.runtime.json'],
    ['env_legacy', '.env'],
    ['env_local', '.env.local'],
    ['env_production', '.env.production'],
    ['env_production_local', '.env.production.local'],
    ['runtime_json', '.frontend-runtime.json'],
];
function describeRelative(relative) {
    const segments = relative.split('/');
    let current = live;
    for (let i = 0; i < segments.length; i++) {
        current = path.join(current, segments[i]);
        const s = stat(current);
        if (!s) return 'ABSENT';
        if (s.isSymbolicLink()) return 'SYMLINK';
        if (i !== segments.length - 1) {
            if (!s.isDirectory()) return 'UNEXPECTED_PARENT';
            continue;
        }
        if (s.isDirectory()) {
            let names;
            try {
                names = fs.readdirSync(current);
            } catch {
                return 'UNREADABLE';
            }
            return names.length ? 'DIR_NONEMPTY' : 'DIR_EMPTY';
        }
        if (s.isFile()) return 'FILE';
        return 'OTHER';
    }
    return 'OTHER';
}

const MAX_ENTRIES = 20000;
const MAX_DEPTH = 12;
function walk(root) {
    const entries = new Map();
    const pending = [{absolute: root, relative: '', depth: 0}];
    let symlinks = 0;
    while (pending.length) {
        const item = pending.pop();
        if (item.depth >= MAX_DEPTH) fail('public-depth-limit-exceeded');
        let names;
        try {
            names = fs.readdirSync(item.absolute);
        } catch {
            fail('public-read-failed');
        }
        for (const name of names) {
            if (++walk.counter > MAX_ENTRIES) fail('public-entry-limit-exceeded');
            const relative = item.relative ? item.relative + '/' + name : name;
            const absolute = path.join(item.absolute, name);
            const st = stat(absolute);
            if (!st) fail('public-entry-disappeared');
            const kind = st.isSymbolicLink() ? 'link' :
                st.isDirectory() ? 'dir' : st.isFile() ? 'file' : 'other';
            entries.set(relative, kind);
            if (kind === 'link') symlinks++;
            if (kind === 'dir') {
                pending.push({absolute, relative, depth: item.depth + 1});
            }
        }
    }
    return {entries, symlinks};
}
walk.counter = 0;
const approved = walk(path.join(sourcePanel, 'public'));
walk.counter = 0;
const present = walk(path.join(live, 'public'));

let liveOnlyFiles = 0;
let liveOnlyDirectories = 0;
let liveOnlyLinks = 0;
let changedTypes = 0;
for (const [name, kind] of present.entries) {
    if (name === '__release.json') continue; // expected generated metadata
    const approvedKind = approved.entries.get(name);
    if (!approvedKind) {
        if (kind === 'file') liveOnlyFiles++;
        else if (kind === 'dir') liveOnlyDirectories++;
        else liveOnlyLinks++;
    } else if (approvedKind !== kind) {
        changedTypes++;
    }
}

const allowedTop = new Set([
    '.next', 'node_modules', 'public', 'src', 'scripts', 'packages',
    '.env.runtime.json', '.env', '.env.local', '.env.production',
    '.env.production.local', '.frontend-runtime.json', '.diagnostics',
    'tmp', 'logs', 'uploads', 'storage', 'data', 'files', 'cache',
    'package.json', 'next.config.js', 'next.config.mjs', 'app.js',
    'app.cjs', 'server.js', 'package-lock.json', 'pnpm-lock.yaml',
    'ecosystem.config.js', '.npmrc', '.salonbw-source-sha',
    'deploy.tar.gz', 'favicon.ico', 'node_modules.old',
]);
let unknownTopCount = 0;
try {
    for (const name of fs.readdirSync(live)) {
        if (!allowedTop.has(name)) unknownTopCount++;
    }
} catch {
    fail('live-root-read-failed');
}
console.log('DEV_PERSISTENCE_AUDIT=PASS target=panel');
console.log('RELEASE_SHA=' + sha);
for (const [label, relative] of candidates) {
    console.log('PATH_' + label.toUpperCase() + '=' + describeRelative(relative));
}
console.log('PUBLIC_LIVE_ONLY_FILE_COUNT=' + liveOnlyFiles);
console.log('PUBLIC_LIVE_ONLY_DIRECTORY_COUNT=' + liveOnlyDirectories);
console.log('PUBLIC_LIVE_ONLY_LINK_OR_OTHER_COUNT=' + liveOnlyLinks);
console.log('PUBLIC_LIVE_SYMLINK_COUNT=' + present.symlinks);
console.log('PUBLIC_SOURCE_SYMLINK_COUNT=' + approved.symlinks);
console.log('PUBLIC_TYPE_MISMATCH_COUNT=' + changedTypes);
console.log('LIVE_TOP_LEVEL_UNCLASSIFIED_COUNT=' + unknownTopCount);
console.log('PERSISTENT_DATA_MAP=REVIEW_REQUIRED');
console.log('RELEASE_ROLLBACK=NOT_IMPLEMENTED');
console.log('RUNTIME_MUTATIONS=NONE');
