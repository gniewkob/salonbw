#!/usr/bin/env node
// Safe release prototype for issue #1663 (PREPARE → VALIDATE → ACTIVATE →
// VERIFY → ROLLBACK). Isolated prototype: it is NOT wired into deploy.yml and
// refuses the real MyDevil account root unless explicitly re-enabled later.
//
// Layout below an application release root (synthetic in tests):
//   releases/<sha40>/          immutable once release.json (READY) exists
//     node_modules -> ../../deps/<fingerprint>/node_modules
//   deps/<fingerprint>/        verified runtime dependency set (READY.json)
//   shared/                    protected runtime config, copied (not linked)
//   current, previous          relative symlinks, replaced via rename(2)
//   .lock/                     exclusive deployment lock (mkdir is atomic)
//
// The active release is never written to: preparation only touches
// releases/.staging-* and deps/.staging-* and publishes with rename(2).
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const RELEASE_ID_RE = /^[0-9a-f]{40}$/;
export const FINGERPRINT_RE = /^[0-9a-f]{64}$/;
export const DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
export const INSTALL_ARGS = Object.freeze([
    'ci',
    '--omit=dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--loglevel=error',
]);
// Shared files copied into a release. app.cjs rejects a symlinked or
// group/world-readable .env.runtime.json, so these must be private copies.
export const SHARED_CONFIG_ALLOWLIST = Object.freeze([
    '.env.runtime.json',
    '.env',
    '.env.production',
]);
const DEP_GROUPS = ['dependencies', 'optionalDependencies', 'devDependencies'];
const MAX_SHARED_FILE_BYTES = 65536;
const FORBIDDEN_ROOT = '/usr/home/vetternkraft';

export class SafeReleaseError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
const fail = (code, message) => {
    throw new SafeReleaseError(code, message);
};

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');
const randomSuffix = () => `${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const lexists = (p) => {
    try {
        fs.lstatSync(p);
        return true;
    } catch {
        return false;
    }
};

// ---------------------------------------------------------------- paths ---

export function assertReleaseId(sha) {
    if (typeof sha !== 'string' || !RELEASE_ID_RE.test(sha))
        fail('INVALID_RELEASE_ID', 'Release id must be an exact 40-char lowercase commit SHA');
    return sha;
}

// The root must be an absolute, normalized, symlink-free path strictly inside
// allowedRoot. Prototype mode additionally refuses the real hosting account.
export function assertSafeRoot(root, allowedRoot, { prototypeOnly = true } = {}) {
    for (const [name, value] of [['root', root], ['allowedRoot', allowedRoot]]) {
        if (typeof value !== 'string' || !path.isAbsolute(value) || path.normalize(value) !== value || value.endsWith(path.sep))
            fail('UNSAFE_PATH', `${name} must be an absolute normalized path`);
    }
    if (root === allowedRoot || !root.startsWith(allowedRoot + path.sep))
        fail('UNSAFE_PATH', 'Release root must be strictly inside the allowed root');
    if (prototypeOnly && (root === FORBIDDEN_ROOT || root.startsWith(FORBIDDEN_ROOT + '/')))
        fail('HOST_PATH_FORBIDDEN', 'Prototype refuses the real hosting account root');
    if (!fs.existsSync(root) || !fs.lstatSync(root).isDirectory())
        fail('UNSAFE_PATH', 'Release root must be an existing directory');
    if (fs.realpathSync(root) !== fs.realpathSync(allowedRoot) + root.slice(allowedRoot.length))
        fail('UNSAFE_PATH', 'Release root must not traverse symlinks');
    return root;
}

function safeRelative(rel) {
    return (
        typeof rel === 'string' &&
        rel.length > 0 &&
        !path.isAbsolute(rel) &&
        !rel.split(/[\\/]/).some((seg) => seg === '..') &&
        !rel.includes('\0')
    );
}

// --------------------------------------------------- manifest & lockfile ---

function isRegistrySpec(spec) {
    return typeof spec === 'string' && !/^(file:|link:|workspace:|git\+|git:|github:|https?:|npm:)/.test(spec) && !spec.includes('/');
}

export function validateManifest(pkg) {
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) fail('MANIFEST_INVALID', 'package.json must be an object');
    for (const group of DEP_GROUPS) {
        const deps = pkg[group];
        if (deps === undefined) continue;
        if (!deps || typeof deps !== 'object') fail('MANIFEST_INVALID', `${group} must be an object`);
        for (const [name, spec] of Object.entries(deps)) {
            if (!isRegistrySpec(spec))
                fail('MANIFEST_NON_REGISTRY', `${group}.${name} is not a plain registry range (${String(spec).slice(0, 40)})`);
        }
    }
    if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0)
        fail('MANIFEST_INVALID', 'Runtime manifest declares no dependencies');
    return pkg;
}

// The lockfile must describe exactly the final (rewritten) runtime manifest,
// with registry provenance and sha512 integrity for every installable entry.
export function validateLockfile(pkg, lock, { registry = DEFAULT_REGISTRY } = {}) {
    if (!lock || typeof lock !== 'object') fail('LOCK_INVALID', 'package-lock.json must be an object');
    if (!(lock.lockfileVersion >= 2) || !lock.packages || typeof lock.packages !== 'object')
        fail('LOCK_INVALID', 'lockfileVersion >= 2 with a packages map is required');
    if (lock.name !== undefined && pkg.name !== undefined && lock.name !== pkg.name)
        fail('LOCK_MISMATCH', 'Lockfile name differs from manifest');
    const rootEntry = lock.packages[''];
    if (!rootEntry) fail('LOCK_INVALID', 'Lockfile root entry missing');
    for (const group of DEP_GROUPS) {
        const want = pkg[group] || {};
        const have = rootEntry[group] || {};
        const keys = new Set([...Object.keys(want), ...Object.keys(have)]);
        for (const key of keys) {
            if (want[key] !== have[key])
                fail('LOCK_MISMATCH', `Lockfile ${group}.${key} does not match the runtime manifest`);
        }
    }
    let entries = 0;
    for (const [key, entry] of Object.entries(lock.packages)) {
        if (key === '') continue;
        if (!key.startsWith('node_modules/') || !safeRelative(key))
            fail('LOCK_UNSAFE_PATH', `Unsafe lockfile package path: ${key.slice(0, 80)}`);
        if (entry.link) fail('LOCK_NON_REGISTRY', `Linked package not allowed: ${key}`);
        if (entry.inBundle) continue;
        if (typeof entry.resolved !== 'string' || !entry.resolved.startsWith(registry))
            fail('LOCK_NON_REGISTRY', `Package outside the allowed registry: ${key}`);
        if (typeof entry.integrity !== 'string' || !/^sha512-[A-Za-z0-9+/=]+$/.test(entry.integrity))
            fail('LOCK_INTEGRITY', `Missing sha512 integrity: ${key}`);
        entries += 1;
    }
    return { entries };
}

export function currentPlatform({ npmVersion } = {}) {
    return {
        platform: process.platform,
        arch: process.arch,
        nodeMajor: Number(process.versions.node.split('.')[0]),
        modulesAbi: process.versions.modules,
        npmMajor: npmVersion ? Number(String(npmVersion).split('.')[0]) : null,
    };
}

// Fingerprint = exact install inputs. Anything that may change the installed
// tree (manifest dependency ranges, lockfile bytes, OS/arch/Node ABI, npm
// major, install flags) must be part of it, so a mismatch forces a fresh,
// isolated install instead of silently reusing incompatible packages.
export function dependencyFingerprint({ pkg, lockText, platform }) {
    const deps = {};
    for (const group of DEP_GROUPS) deps[group] = pkg[group] ? Object.fromEntries(Object.entries(pkg[group]).sort()) : {};
    const canonical = JSON.stringify({
        v: 1,
        deps,
        overrides: pkg.overrides ?? null,
        lockSha256: sha256(lockText),
        platform: {
            platform: platform.platform,
            arch: platform.arch,
            nodeMajor: platform.nodeMajor,
            modulesAbi: platform.modulesAbi,
            npmMajor: platform.npmMajor,
        },
        installArgs: INSTALL_ARGS,
    });
    return sha256(canonical);
}

export function platformCompatible(recorded, platform) {
    return (
        !!recorded &&
        recorded.platform === platform.platform &&
        recorded.arch === platform.arch &&
        recorded.nodeMajor === platform.nodeMajor &&
        recorded.modulesAbi === platform.modulesAbi &&
        recorded.npmMajor === platform.npmMajor
    );
}

// ----------------------------------------------------------- tree hashing ---

// Deterministic content hash of a release tree. Symlinks other than the
// top-level node_modules link and special files make the release invalid.
export function treeHash(dir, { exclude = ['release.json', 'node_modules'] } = {}) {
    const lines = [];
    const walk = (rel) => {
        const abs = path.join(dir, rel);
        for (const name of fs.readdirSync(abs).sort()) {
            const childRel = rel ? `${rel}/${name}` : name;
            if (!rel && exclude.includes(name)) continue;
            const st = fs.lstatSync(path.join(dir, childRel));
            if (st.isSymbolicLink()) fail('TREE_SYMLINK', `Unexpected symlink in release: ${childRel}`);
            if (st.isDirectory()) {
                lines.push(`d ${childRel}`);
                walk(childRel);
            } else if (st.isFile()) {
                lines.push(`f ${childRel} ${st.size} ${sha256(fs.readFileSync(path.join(dir, childRel)))}`);
            } else fail('TREE_SPECIAL', `Special file in release: ${childRel}`);
        }
    };
    walk('');
    return { hash: sha256(lines.join('\n')), files: lines.filter((l) => l.startsWith('f ')).length };
}

// ---------------------------------------------------------------- locking ---

export function acquireLock(root, owner) {
    const lockDir = path.join(root, '.lock');
    try {
        fs.mkdirSync(lockDir, { mode: 0o700 });
    } catch (err) {
        if (err.code === 'EEXIST') fail('LOCKED', 'Another deployment holds the release lock (stale locks are never auto-broken)');
        throw err;
    }
    fs.writeFileSync(path.join(lockDir, 'owner'), `${owner}\n`, { mode: 0o600 });
    return () => fs.rmSync(lockDir, { recursive: true, force: true });
}

function withLock(root, owner, fn) {
    const release = acquireLock(root, owner);
    return Promise.resolve()
        .then(fn)
        .finally(release);
}

// ---------------------------------------------------------------- archive ---

export function listArchive(archivePath, tarBin = 'tar') {
    const out = spawnSync(tarBin, ['-tzf', archivePath], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (out.status !== 0) fail('ARCHIVE_CORRUPT', 'Archive listing failed');
    const names = out.stdout.split('\n').filter(Boolean);
    for (const raw of names) {
        const name = raw.replace(/^\.\//, '').replace(/\/$/, '');
        if (name === '' || name === '.') continue;
        if (!safeRelative(name)) fail('ARCHIVE_UNSAFE_PATH', `Unsafe archive entry: ${raw.slice(0, 80)}`);
        if (name === 'node_modules' || name.startsWith('node_modules/'))
            fail('ARCHIVE_HAS_NODE_MODULES', 'Archive must not ship node_modules (platform-specific)');
        if (name === 'release.json') fail('ARCHIVE_UNSAFE_PATH', 'Archive must not provide release.json');
    }
    return names.length;
}

function extractArchive(archivePath, dest, tarBin = 'tar') {
    const out = spawnSync(tarBin, ['-xzf', archivePath, '-C', dest, '--no-same-owner'], { encoding: 'utf8' });
    if (out.status !== 0) fail('ARCHIVE_EXTRACT_FAILED', 'Archive extraction failed');
}

// --------------------------------------------------------- dependencies ---

function relativeLink(fromDir, target) {
    return path.relative(fromDir, target);
}

export function defaultInstaller({ npmBin = 'npm' } = {}) {
    return ({ cwd }) => {
        const out = spawnSync(npmBin, INSTALL_ARGS, { cwd, encoding: 'utf8', env: { ...process.env, npm_config_update_notifier: 'false' } });
        if (out.status !== 0) fail('INSTALL_FAILED', `npm ci failed (exit ${out.status})`);
    };
}

// Verifies the installed tree matches the lockfile (package.json present for
// every installed, non-optional lock entry) — catches partial extraction such
// as the 2026-06-01 @sentry/core incident.
export function verifyInstalledTree(depsDir, lock, { omitDev = true } = {}) {
    const nm = path.join(depsDir, 'node_modules');
    if (!fs.existsSync(nm) || fs.lstatSync(nm).isSymbolicLink()) fail('DEPS_INCOMPLETE', 'node_modules missing');
    let checked = 0;
    for (const [key, entry] of Object.entries(lock.packages)) {
        if (key === '' || (omitDev && entry.dev) || entry.optional || entry.devOptional) continue;
        if (!fs.existsSync(path.join(depsDir, key, 'package.json')))
            fail('DEPS_INCOMPLETE', `Installed tree missing ${key}`);
        checked += 1;
    }
    return checked;
}

function readDepsReady(depsDir) {
    const file = path.join(depsDir, 'READY.json');
    if (!fs.existsSync(file) || fs.lstatSync(depsDir).isSymbolicLink()) return null;
    try {
        return readJson(file);
    } catch {
        return null;
    }
}

async function ensureDependencies(root, { fingerprint, pkg, lock, lockText, platform, installer, probe, stats, hooks }) {
    const depsRoot = path.join(root, 'deps');
    fs.mkdirSync(depsRoot, { recursive: true, mode: 0o700 });
    const target = path.join(depsRoot, fingerprint);
    const ready = readDepsReady(target);
    if (ready) {
        if (ready.fingerprint !== fingerprint || ready.lockSha256 !== sha256(lockText) || !platformCompatible(ready.platform, platform))
            fail('DEPS_MISMATCH', 'Existing dependency set does not match its fingerprint');
        verifyInstalledTree(target, lock);
        stats.reused += 1;
        return target;
    }
    if (lexists(target)) fail('DEPS_INCOMPLETE', 'Dependency directory exists without READY marker; refusing reuse');
    const staging = path.join(depsRoot, `.staging-${fingerprint.slice(0, 12)}-${randomSuffix()}`);
    fs.mkdirSync(staging, { mode: 0o700 });
    try {
        fs.writeFileSync(path.join(staging, 'package.json'), JSON.stringify(pkg, null, 2));
        fs.writeFileSync(path.join(staging, 'package-lock.json'), lockText);
        await hooks.step('deps:before-install');
        stats.installs += 1;
        await installer({ cwd: staging, pkg, lock });
        const checked = verifyInstalledTree(staging, lock);
        if (probe) await probe({ cwd: staging });
        fs.writeFileSync(
            path.join(staging, 'READY.json'),
            JSON.stringify({ fingerprint, lockSha256: sha256(lockText), platform, checkedPackages: checked, createdAt: new Date().toISOString() }, null, 2),
        );
        fs.renameSync(staging, target);
    } catch (err) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw err;
    }
    return target;
}

// ---------------------------------------------------------------- prepare ---

function copySharedConfig(root, staging, names) {
    const sharedDir = path.join(root, 'shared');
    for (const name of names) {
        if (!SHARED_CONFIG_ALLOWLIST.includes(name)) fail('CONFIG_NOT_ALLOWED', `Shared config not allowlisted: ${name}`);
        const src = path.join(sharedDir, name);
        if (!lexists(src)) fail('CONFIG_MISSING', `Missing shared config: ${name}`);
        const st = fs.lstatSync(src);
        if (!st.isFile() || st.isSymbolicLink()) fail('CONFIG_UNSAFE', `Shared config must be a regular file: ${name}`);
        if ((st.mode & 0o077) !== 0) fail('CONFIG_UNSAFE', `Shared config must be owner-only: ${name}`);
        if (st.size > MAX_SHARED_FILE_BYTES) fail('CONFIG_UNSAFE', `Shared config too large: ${name}`);
        const dest = path.join(staging, name);
        if (lexists(dest)) fail('CONFIG_CONFLICT', `Artifact already contains protected config: ${name}`);
        fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL);
        fs.chmodSync(dest, 0o600);
    }
}

function validateArtifactContents(staging, sha) {
    for (const required of ['package.json', 'package-lock.json', '.next/BUILD_ID', 'public/__release.json']) {
        if (!fs.existsSync(path.join(staging, required))) fail('ARTIFACT_INCOMPLETE', `Artifact missing ${required}`);
    }
    if (!fs.existsSync(path.join(staging, '.next/static')) || !fs.statSync(path.join(staging, '.next/static')).isDirectory())
        fail('ARTIFACT_INCOMPLETE', 'Artifact missing .next/static');
    if (!fs.existsSync(path.join(staging, 'app.cjs')) && !fs.existsSync(path.join(staging, 'app.js')))
        fail('ARTIFACT_INCOMPLETE', 'Artifact missing Passenger entrypoint');
    let meta;
    try {
        meta = readJson(path.join(staging, 'public/__release.json'));
    } catch {
        fail('ARTIFACT_INCOMPLETE', 'Release metadata unreadable');
    }
    if (meta.sha !== sha) fail('RELEASE_SHA_MISMATCH', 'Artifact release metadata does not match the requested SHA');
}

export async function prepareRelease(opts) {
    const {
        root,
        allowedRoot,
        sha,
        archivePath,
        archiveSha256,
        sharedConfig = [],
        installer = defaultInstaller(),
        probe = null,
        platform = currentPlatform(),
        registry = DEFAULT_REGISTRY,
        prototypeOnly = true,
        hooks = {},
        tarBin = 'tar',
    } = opts;
    const step = async (name) => hooks.step && (await hooks.step(name));
    assertReleaseId(sha);
    assertSafeRoot(root, allowedRoot, { prototypeOnly });
    const stats = { installs: 0, reused: 0 };
    return withLock(root, `prepare ${sha}`, async () => {
        const releasesDir = path.join(root, 'releases');
        fs.mkdirSync(releasesDir, { recursive: true, mode: 0o755 });
        const finalDir = path.join(releasesDir, sha);
        if (lexists(finalDir)) {
            verifyRelease({ root, allowedRoot, sha, platform, prototypeOnly });
            return { status: 'already-prepared', sha, stats };
        }
        if (!/^[0-9a-f]{64}$/.test(archiveSha256 || '')) fail('ARCHIVE_DIGEST_REQUIRED', 'Expected archive sha256 is required');
        if (!fs.existsSync(archivePath) || sha256(fs.readFileSync(archivePath)) !== archiveSha256)
            fail('ARCHIVE_DIGEST_MISMATCH', 'Archive digest mismatch');
        listArchive(archivePath, tarBin);
        const staging = path.join(releasesDir, `.staging-${sha.slice(0, 12)}-${randomSuffix()}`);
        fs.mkdirSync(staging, { mode: 0o755 });
        try {
            await step('extract:before');
            extractArchive(archivePath, staging, tarBin);
            await step('extract:after');
            treeHash(staging); // rejects symlinks/special files from the archive
            if (lexists(path.join(staging, 'node_modules'))) fail('ARCHIVE_HAS_NODE_MODULES', 'Archive shipped node_modules');
            validateArtifactContents(staging, sha);
            const pkg = validateManifest(readJson(path.join(staging, 'package.json')));
            const lockText = fs.readFileSync(path.join(staging, 'package-lock.json'), 'utf8');
            let lock;
            try {
                lock = JSON.parse(lockText);
            } catch {
                fail('LOCK_INVALID', 'package-lock.json is not valid JSON');
            }
            validateLockfile(pkg, lock, { registry });
            const fingerprint = dependencyFingerprint({ pkg, lockText, platform });
            const depsDir = await ensureDependencies(root, { fingerprint, pkg, lock, lockText, platform, installer, probe, stats, hooks: { step } });
            copySharedConfig(root, staging, sharedConfig);
            // Protected config is excluded from the content hash (no secret
            // verifier is persisted) and checked for type/permissions instead.
            const tree = treeHash(staging, { exclude: ['release.json', 'node_modules', ...sharedConfig] });
            fs.symlinkSync(relativeLink(staging, path.join(depsDir, 'node_modules')), path.join(staging, 'node_modules'));
            await step('publish:before');
            fs.writeFileSync(
                path.join(staging, 'release.json'),
                JSON.stringify({ sha, fingerprint, treeHash: tree.hash, files: tree.files, sharedConfig, platform, archiveSha256, preparedAt: new Date().toISOString() }, null, 2),
            );
            fs.renameSync(staging, finalDir); // publish: complete or invisible
        } catch (err) {
            fs.rmSync(staging, { recursive: true, force: true });
            throw err;
        }
        return { status: 'prepared', sha, stats };
    });
}

// ----------------------------------------------------------------- verify ---

export function verifyRelease({ root, allowedRoot, sha, platform = currentPlatform(), prototypeOnly = true }) {
    assertReleaseId(sha);
    assertSafeRoot(root, allowedRoot, { prototypeOnly });
    const dir = path.join(root, 'releases', sha);
    if (!lexists(dir) || !fs.lstatSync(dir).isDirectory()) fail('RELEASE_MISSING', `Release ${sha.slice(0, 12)} is not prepared`);
    const metaFile = path.join(dir, 'release.json');
    if (!fs.existsSync(metaFile)) fail('RELEASE_INCOMPLETE', 'Release has no READY metadata');
    const meta = readJson(metaFile);
    if (meta.sha !== sha) fail('RELEASE_SHA_MISMATCH', 'Release metadata SHA mismatch');
    if (!FINGERPRINT_RE.test(meta.fingerprint || '')) fail('RELEASE_INCOMPLETE', 'Release fingerprint missing');
    validateArtifactContents(dir, sha);
    const sharedConfig = Array.isArray(meta.sharedConfig) ? meta.sharedConfig : [];
    for (const name of sharedConfig) {
        if (!SHARED_CONFIG_ALLOWLIST.includes(name)) fail('CONFIG_NOT_ALLOWED', 'Release records non-allowlisted config');
        const file = path.join(dir, name);
        const st = lexists(file) ? fs.lstatSync(file) : null;
        if (!st || !st.isFile() || (st.mode & 0o077) !== 0) fail('CONFIG_UNSAFE', `Release config missing or not owner-only: ${name}`);
    }
    if (treeHash(dir, { exclude: ['release.json', 'node_modules', ...sharedConfig] }).hash !== meta.treeHash)
        fail('RELEASE_TAMPERED', 'Release content changed after preparation');
    const link = path.join(dir, 'node_modules');
    const depsDir = path.join(root, 'deps', meta.fingerprint);
    if (!lexists(link) || !fs.lstatSync(link).isSymbolicLink() || path.resolve(dir, fs.readlinkSync(link)) !== path.join(depsDir, 'node_modules'))
        fail('RELEASE_DEPS_LINK', 'Release node_modules link is missing or points elsewhere');
    const ready = readDepsReady(depsDir);
    if (!ready || ready.fingerprint !== meta.fingerprint) fail('DEPS_INCOMPLETE', 'Dependency set for release is not READY');
    if (!platformCompatible(ready.platform, platform)) fail('DEPS_PLATFORM', 'Dependency set built for a different platform/ABI');
    verifyInstalledTree(depsDir, readJson(path.join(dir, 'package-lock.json')));
    return meta;
}

// -------------------------------------------------- activation & rollback ---

export function readPointer(root, name) {
    const link = path.join(root, name);
    if (!lexists(link)) return null;
    if (!fs.lstatSync(link).isSymbolicLink()) fail('POINTER_INVALID', `${name} must be a symlink`);
    const target = fs.readlinkSync(link);
    const match = /^releases\/([0-9a-f]{40})$/.exec(target);
    if (!match) fail('POINTER_INVALID', `${name} points outside releases/`);
    return match[1];
}

// rename(2) replaces the link atomically without following it (unlike `mv`
// onto a directory symlink, which differs between BSD and GNU coreutils).
export function setPointer(root, name, sha) {
    const link = path.join(root, name);
    if (sha === null) {
        fs.rmSync(link, { force: true });
        return;
    }
    assertReleaseId(sha);
    const tmp = path.join(root, `.${name}.tmp-${randomSuffix()}`);
    fs.symlinkSync(`releases/${sha}`, tmp);
    fs.renameSync(tmp, link);
}

async function switchAndVerify(root, { from, prevBefore, to, newPrevious, adapter, step }) {
    setPointer(root, 'previous', newPrevious);
    await step('activate:before-switch');
    setPointer(root, 'current', to);
    await step('activate:after-switch');
    try {
        await adapter.restart(to);
        await adapter.healthcheck(to);
        return { status: 'activated', current: to, previous: newPrevious };
    } catch (err) {
        // Recovery boundary: restore the last verified state, then restart.
        setPointer(root, 'current', from);
        setPointer(root, 'previous', prevBefore);
        let recovered = false;
        if (from) {
            try {
                await adapter.restart(from);
                await adapter.healthcheck(from);
                recovered = true;
            } catch {
                recovered = false;
            }
        }
        const error = new SafeReleaseError(recovered ? 'ACTIVATION_ROLLED_BACK' : 'ACTIVATION_RECOVERY_FAILED', `Activation of ${to.slice(0, 12)} failed: ${err.message}`);
        error.recovered = recovered;
        throw error;
    }
}

export async function activateRelease({ root, allowedRoot, sha, adapter, platform = currentPlatform(), prototypeOnly = true, hooks = {} }) {
    const step = async (name) => hooks.step && (await hooks.step(name));
    assertReleaseId(sha);
    assertSafeRoot(root, allowedRoot, { prototypeOnly });
    if (!adapter || typeof adapter.restart !== 'function' || typeof adapter.healthcheck !== 'function')
        fail('ADAPTER_REQUIRED', 'An explicit restart/healthcheck adapter is required');
    return withLock(root, `activate ${sha}`, async () => {
        verifyRelease({ root, allowedRoot, sha, platform, prototypeOnly });
        const from = readPointer(root, 'current');
        const prevBefore = readPointer(root, 'previous');
        if (from === sha) return { status: 'already-active', current: sha, previous: prevBefore };
        return switchAndVerify(root, { from, prevBefore, to: sha, newPrevious: from, adapter, step });
    });
}

export async function rollbackRelease({ root, allowedRoot, adapter, platform = currentPlatform(), prototypeOnly = true, hooks = {} }) {
    const step = async (name) => hooks.step && (await hooks.step(name));
    assertSafeRoot(root, allowedRoot, { prototypeOnly });
    if (!adapter) fail('ADAPTER_REQUIRED', 'An explicit restart/healthcheck adapter is required');
    return withLock(root, 'rollback', async () => {
        const from = readPointer(root, 'current');
        const target = readPointer(root, 'previous');
        if (!target) fail('ROLLBACK_NO_TARGET', 'No previous release recorded');
        if (target === from) fail('ROLLBACK_NO_TARGET', 'Previous release equals current');
        verifyRelease({ root, allowedRoot, sha: target, platform, prototypeOnly });
        return switchAndVerify(root, { from, prevBefore: target, to: target, newPrevious: from, adapter, step });
    });
}

// ----------------------------------------------------------------- usage ---

export function diskUsageBytes(dir) {
    let total = 0;
    const walk = (p) => {
        const st = fs.lstatSync(p);
        if (st.isSymbolicLink()) return;
        if (st.isDirectory()) for (const name of fs.readdirSync(p)) walk(path.join(p, name));
        else total += st.size;
    };
    if (lexists(dir)) walk(dir);
    return total;
}

// ------------------------------------------------------------------- CLI ---
// Only non-mutating-to-runtime commands are exposed. Activation/rollback need
// a provider adapter (Passenger restart + release-aware healthcheck) that is
// deliberately NOT implemented in this prototype.
function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const key = argv[i];
        if (!key.startsWith('--')) fail('USAGE', `Unexpected argument ${key}`);
        args[key.slice(2)] = argv[i + 1];
        i += 1;
    }
    return args;
}

async function main(argv) {
    const [command, ...rest] = argv;
    const args = parseArgs(rest);
    const common = { root: args.root, allowedRoot: args['allowed-root'] };
    if (command === 'check-lock') {
        const pkg = validateManifest(readJson(args.manifest));
        const result = validateLockfile(pkg, readJson(args.lock));
        console.log(JSON.stringify({ ok: true, ...result }));
    } else if (command === 'prepare') {
        const npmVersion = spawnSync(args.npm || 'npm', ['--version'], { encoding: 'utf8' }).stdout.trim();
        const result = await prepareRelease({
            ...common,
            sha: args.sha,
            archivePath: args.archive,
            archiveSha256: args['archive-sha256'],
            sharedConfig: args.shared ? args.shared.split(',') : [],
            installer: defaultInstaller({ npmBin: args.npm || 'npm' }),
            platform: currentPlatform({ npmVersion }),
        });
        console.log(JSON.stringify(result));
    } else if (command === 'verify') {
        const npmVersion = spawnSync(args.npm || 'npm', ['--version'], { encoding: 'utf8' }).stdout.trim();
        const meta = verifyRelease({ ...common, sha: args.sha, platform: currentPlatform({ npmVersion }) });
        console.log(JSON.stringify({ ok: true, sha: meta.sha, fingerprint: meta.fingerprint }));
    } else if (command === 'status') {
        assertSafeRoot(common.root, common.allowedRoot);
        console.log(JSON.stringify({ current: readPointer(common.root, 'current'), previous: readPointer(common.root, 'previous') }));
    } else {
        fail('USAGE', 'Usage: safe-release.mjs <check-lock|prepare|verify|status> [--root ABS --allowed-root ABS ...]');
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
    main(process.argv.slice(2)).catch((err) => {
        console.error(`safe-release: ${err.code || 'ERROR'}: ${err.message}`);
        process.exit(1);
    });
}
