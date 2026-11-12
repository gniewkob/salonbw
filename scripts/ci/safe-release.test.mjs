// Unit + integration tests for the #1663 safe release prototype.
// Run: node --test scripts/ci/safe-release.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import {
    acquireLock,
    activateRelease,
    assertReleaseId,
    assertSafeRoot,
    dependencyFingerprint,
    listArchive,
    platformCompatible,
    prepareRelease,
    readPointer,
    rollbackRelease,
    treeHash,
    validateLockfile,
    validateManifest,
    verifyRelease,
} from './safe-release.mjs';
import { PLATFORM, fakeInstaller, lockFor, makeArtifact, makeSandbox, shaOf, writeHostileTar } from './safe-release-testkit.mjs';

const SHA_A = shaOf('A');
const SHA_B = shaOf('B');
const pkg = { name: '@salonbw/panel', version: '0.1.0', dependencies: { next: '15.5.28', react: '18.3.1' }, devDependencies: { jest: '30.4.2' } };
const expectCode = (code) => (err) => {
    assert.equal(err.code, code, `expected ${code}, got ${err.code}: ${err.message}`);
    return true;
};

// Records every adapter call; healthcheck trivially succeeds.
function recordingAdapter({ failHealthFor = null } = {}) {
    const calls = [];
    return {
        calls,
        restart: async (sha) => calls.push(['restart', sha]),
        healthcheck: async (sha) => {
            calls.push(['health', sha]);
            if (sha === failHealthFor) throw new Error('synthetic health failure');
        },
    };
}

describe('unit: identity, paths, manifest, lockfile, fingerprint', () => {
    test('release id must be an exact 40-char lowercase SHA', () => {
        assert.equal(assertReleaseId(SHA_A), SHA_A);
        for (const bad of ['', 'abc', SHA_A.toUpperCase(), `${SHA_A}0`, '../' + SHA_A.slice(3), null])
            assert.throws(() => assertReleaseId(bad), expectCode('INVALID_RELEASE_ID'));
    });

    test('unsafe roots are rejected', () => {
        const sb = makeSandbox();
        try {
            assert.equal(assertSafeRoot(sb.root, sb.allowedRoot), sb.root);
            assert.throws(() => assertSafeRoot(sb.allowedRoot, sb.allowedRoot), expectCode('UNSAFE_PATH'));
            assert.throws(() => assertSafeRoot('relative/path', sb.allowedRoot), expectCode('UNSAFE_PATH'));
            assert.throws(() => assertSafeRoot(`${sb.allowedRoot}/apps/../apps/nodejs`, sb.allowedRoot), expectCode('UNSAFE_PATH'));
            assert.throws(() => assertSafeRoot('/etc', sb.allowedRoot), expectCode('UNSAFE_PATH'));
            assert.throws(() => assertSafeRoot(`${sb.root}/`, sb.allowedRoot), expectCode('UNSAFE_PATH'));
            assert.throws(() => assertSafeRoot('/usr/home/vetternkraft/apps/nodejs/panelbw_dev', '/usr/home/vetternkraft'), expectCode('HOST_PATH_FORBIDDEN'));
            // A symlinked component inside the allowed root is refused.
            const linked = path.join(sb.allowedRoot, 'linked');
            fs.symlinkSync(sb.root, linked);
            assert.throws(() => assertSafeRoot(linked, sb.allowedRoot), expectCode('UNSAFE_PATH'));
        } finally {
            sb.cleanup();
        }
    });

    test('manifest accepts only plain registry ranges', () => {
        validateManifest(pkg);
        for (const spec of ['file:./packages/api', 'link:../../packages/api', 'workspace:*', 'git+https://x/y.git', 'github:a/b', 'https://x/y.tgz', 'npm:other@1'])
            assert.throws(() => validateManifest({ dependencies: { x: spec } }), expectCode('MANIFEST_NON_REGISTRY'));
        assert.throws(() => validateManifest({ dependencies: {} }), expectCode('MANIFEST_INVALID'));
        assert.throws(() => validateManifest([]), expectCode('MANIFEST_INVALID'));
    });

    test('lockfile must match the final runtime manifest exactly', () => {
        const lock = lockFor(pkg);
        assert.equal(validateLockfile(pkg, lock).entries, 3);
        const drifted = structuredClone(lock);
        drifted.packages[''].dependencies.next = '15.5.27';
        assert.throws(() => validateLockfile(pkg, drifted), expectCode('LOCK_MISMATCH'));
        const extra = structuredClone(lock);
        extra.packages[''].dependencies['@salonbw/api'] = 'file:./packages/api';
        assert.throws(() => validateLockfile(pkg, extra), expectCode('LOCK_MISMATCH'));
        assert.throws(() => validateLockfile(pkg, { ...lock, lockfileVersion: 1 }), expectCode('LOCK_INVALID'));
    });

    test('lockfile provenance and integrity are enforced', () => {
        const base = lockFor(pkg);
        const cases = [
            ['LOCK_NON_REGISTRY', (l) => (l.packages['node_modules/next'].resolved = 'https://evil.example/next.tgz')],
            ['LOCK_INTEGRITY', (l) => delete l.packages['node_modules/next'].integrity],
            ['LOCK_INTEGRITY', (l) => (l.packages['node_modules/next'].integrity = 'sha1-abc')],
            ['LOCK_NON_REGISTRY', (l) => (l.packages['node_modules/next'] = { link: true, resolved: 'packages/api' })],
            ['LOCK_UNSAFE_PATH', (l) => (l.packages['node_modules/../../etc'] = l.packages['node_modules/next'])],
            ['LOCK_UNSAFE_PATH', (l) => (l.packages['packages/api'] = l.packages['node_modules/next'])],
        ];
        for (const [code, mutate] of cases) {
            const lock = structuredClone(base);
            mutate(lock);
            assert.throws(() => validateLockfile(pkg, lock), expectCode(code));
        }
    });

    test('fingerprint changes with every install input and is order-independent', () => {
        const lockText = JSON.stringify(lockFor(pkg));
        const fp = dependencyFingerprint({ pkg, lockText, platform: PLATFORM });
        assert.match(fp, /^[0-9a-f]{64}$/);
        const reordered = { ...pkg, dependencies: { react: '18.3.1', next: '15.5.28' } };
        assert.equal(dependencyFingerprint({ pkg: reordered, lockText, platform: PLATFORM }), fp);
        const variants = [
            { pkg: { ...pkg, dependencies: { ...pkg.dependencies, react: '18.3.0' } }, lockText, platform: PLATFORM },
            { pkg, lockText: lockText + ' ', platform: PLATFORM },
            { pkg: { ...pkg, overrides: { ws: '8.18.0' } }, lockText, platform: PLATFORM },
            ...['platform', 'arch', 'nodeMajor', 'modulesAbi', 'npmMajor'].map((k) => ({ pkg, lockText, platform: { ...PLATFORM, [k]: k === 'nodeMajor' || k === 'npmMajor' ? 99 : 'other' } })),
        ];
        const seen = new Set([fp]);
        for (const v of variants) seen.add(dependencyFingerprint(v));
        assert.equal(seen.size, variants.length + 1);
    });

    test('platform compatibility decisions fail closed', () => {
        assert.equal(platformCompatible(PLATFORM, PLATFORM), true);
        assert.equal(platformCompatible(null, PLATFORM), false);
        assert.equal(platformCompatible({ ...PLATFORM, platform: 'linux' }, PLATFORM), false);
        assert.equal(platformCompatible({ ...PLATFORM, modulesAbi: '137' }, PLATFORM), false);
        assert.equal(platformCompatible({ ...PLATFORM, npmMajor: null }, PLATFORM), false);
    });

    test('tree hash detects content changes and rejects symlinks', () => {
        const sb = makeSandbox();
        try {
            const dir = path.join(sb.base, 'tree');
            fs.mkdirSync(path.join(dir, 'a'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'a', 'f.txt'), 'one');
            const h1 = treeHash(dir).hash;
            fs.writeFileSync(path.join(dir, 'a', 'f.txt'), 'two');
            assert.notEqual(treeHash(dir).hash, h1);
            fs.symlinkSync('/etc/passwd', path.join(dir, 'a', 'evil'));
            assert.throws(() => treeHash(dir), expectCode('TREE_SYMLINK'));
        } finally {
            sb.cleanup();
        }
    });

    test('archive listing rejects traversal and shipped node_modules', () => {
        const sb = makeSandbox();
        try {
            const bad = makeArtifact(sb.base, { sha: SHA_A, mutate: (d) => fs.mkdirSync(path.join(d, 'node_modules', 'x'), { recursive: true }) });
            assert.throws(() => listArchive(bad.archivePath), expectCode('ARCHIVE_HAS_NODE_MODULES'));
            for (const name of ['../evil.js', '/etc/cron.d/evil', 'public/../../evil', 'release.json']) {
                const hostile = path.join(sb.base, 'hostile.tar.gz');
                writeHostileTar(hostile, [{ name: 'package.json', content: '{}' }, { name, content: 'x' }]);
                assert.throws(() => listArchive(hostile), expectCode('ARCHIVE_UNSAFE_PATH'), name);
            }
            const corrupt = path.join(sb.base, 'corrupt.tar.gz');
            fs.writeFileSync(corrupt, 'not a tarball');
            assert.throws(() => listArchive(corrupt), expectCode('ARCHIVE_CORRUPT'));
        } finally {
            sb.cleanup();
        }
    });

    test('lock is exclusive and never auto-broken', () => {
        const sb = makeSandbox();
        try {
            const release = acquireLock(sb.root, 'first');
            assert.throws(() => acquireLock(sb.root, 'second'), expectCode('LOCKED'));
            release();
            acquireLock(sb.root, 'third')();
        } finally {
            sb.cleanup();
        }
    });
});

describe('integration: prepare / activate / rollback on a synthetic root', () => {
    let sb;
    let inst;
    const prep = (sha, extra = {}) => {
        const art = extra.artifact ?? makeArtifact(sb.base, { sha, depVersion: extra.depVersion });
        return prepareRelease({
            root: sb.root,
            allowedRoot: sb.allowedRoot,
            sha,
            archivePath: art.archivePath,
            archiveSha256: extra.archiveSha256 ?? art.archiveSha256,
            sharedConfig: ['.env.runtime.json'],
            installer: (extra.inst ?? inst).installer,
            platform: extra.platform ?? PLATFORM,
            hooks: extra.hooks,
        });
    };
    const verify = (sha, platform = PLATFORM) => verifyRelease({ root: sb.root, allowedRoot: sb.allowedRoot, sha, platform });
    const activate = (sha, adapter, hooks) => activateRelease({ root: sb.root, allowedRoot: sb.allowedRoot, sha, adapter, platform: PLATFORM, hooks });
    const rollback = (adapter) => rollbackRelease({ root: sb.root, allowedRoot: sb.allowedRoot, adapter, platform: PLATFORM });
    const releaseDirs = () => fs.readdirSync(path.join(sb.root, 'releases')).sort();
    const depsDirs = () => fs.readdirSync(path.join(sb.root, 'deps')).sort();

    beforeEach(() => {
        sb = makeSandbox();
        inst = fakeInstaller();
    });
    afterEach(() => sb.cleanup());

    test('prepare A, then B without modifying A', async () => {
        assert.equal((await prep(SHA_A)).status, 'prepared');
        const before = treeHash(path.join(sb.root, 'releases', SHA_A)).hash;
        const r = await prep(SHA_B, { depVersion: '2.0.0' });
        assert.equal(r.status, 'prepared');
        assert.equal(treeHash(path.join(sb.root, 'releases', SHA_A)).hash, before);
        verify(SHA_A);
        verify(SHA_B);
        assert.deepEqual(releaseDirs(), [SHA_A, SHA_B].sort());
        assert.equal(depsDirs().length, 2);
        assert.equal(inst.state.calls, 2);
        // Installs happened only in inactive staging directories.
        for (const cwd of inst.state.cwds) assert.match(path.basename(cwd), /^\.staging-/);
    });

    test('unchanged fingerprint reuses verified dependencies (no install)', async () => {
        await prep(SHA_A);
        const r = await prep(SHA_B); // same deps, different code
        assert.deepEqual(r.stats, { installs: 0, reused: 1 });
        assert.equal(inst.state.calls, 1);
        assert.equal(depsDirs().length, 1);
    });

    test('changed platform/ABI forces a fresh isolated install', async () => {
        await prep(SHA_A);
        const r = await prep(SHA_B, { platform: { ...PLATFORM, modulesAbi: '137' } });
        assert.deepEqual(r.stats, { installs: 1, reused: 0 });
        assert.equal(depsDirs().length, 2);
        // A's deps are incompatible with the new runtime ABI → fail closed.
        assert.throws(() => verify(SHA_A, { ...PLATFORM, modulesAbi: '137' }), expectCode('DEPS_PLATFORM'));
    });

    test('idempotent preparation and repeated activation', async () => {
        await prep(SHA_A);
        assert.equal((await prep(SHA_A)).status, 'already-prepared');
        assert.equal(inst.state.calls, 1);
        const adapter = recordingAdapter();
        assert.equal((await activate(SHA_A, adapter)).status, 'activated');
        assert.equal((await activate(SHA_A, adapter)).status, 'already-active');
        assert.deepEqual(adapter.calls, [['restart', SHA_A], ['health', SHA_A]]);
    });

    test('A → B → A → B with preserved config and synthetic user data', async () => {
        await prep(SHA_A);
        await prep(SHA_B, { depVersion: '2.0.0' });
        const adapter = recordingAdapter();
        await activate(SHA_A, adapter);
        assert.equal((await activate(SHA_B, adapter)).previous, SHA_A);
        assert.deepEqual([readPointer(sb.root, 'current'), readPointer(sb.root, 'previous')], [SHA_B, SHA_A]);
        await rollback(adapter);
        assert.deepEqual([readPointer(sb.root, 'current'), readPointer(sb.root, 'previous')], [SHA_A, SHA_B]);
        await activate(SHA_B, adapter);
        assert.deepEqual([readPointer(sb.root, 'current'), readPointer(sb.root, 'previous')], [SHA_B, SHA_A]);
        for (const sha of [SHA_A, SHA_B]) {
            const cfg = path.join(sb.root, 'releases', sha, '.env.runtime.json');
            assert.equal(fs.lstatSync(cfg).isSymbolicLink(), false);
            assert.equal(fs.statSync(cfg).mode & 0o777, 0o600);
            assert.equal(JSON.parse(fs.readFileSync(cfg, 'utf8')).APP_ENV, 'development');
        }
        assert.equal(fs.readFileSync(path.join(sb.allowedRoot, 'uploads', 'user-photo.txt'), 'utf8'), 'synthetic user data');
        assert.ok(fs.existsSync(path.join(sb.root, 'shared', '.env.runtime.json')));
        // release.json persists no secret material
        assert.doesNotMatch(fs.readFileSync(path.join(sb.root, 'releases', SHA_A, 'release.json'), 'utf8'), /not-a-secret/);
    });

    test('incomplete B is rejected and never published', async () => {
        const cases = [
            ['ARTIFACT_INCOMPLETE', (d) => fs.rmSync(path.join(d, '.next', 'BUILD_ID'))],
            ['ARTIFACT_INCOMPLETE', (d) => fs.rmSync(path.join(d, 'package-lock.json'))],
            ['ARTIFACT_INCOMPLETE', (d) => fs.rmSync(path.join(d, 'app.cjs'))],
            ['RELEASE_SHA_MISMATCH', (d) => fs.writeFileSync(path.join(d, 'public', '__release.json'), JSON.stringify({ sha: SHA_A }))],
            ['TREE_SYMLINK', (d) => fs.symlinkSync('/etc/passwd', path.join(d, 'public', 'leak'))],
            ['LOCK_INVALID', (d) => fs.writeFileSync(path.join(d, 'package-lock.json'), '{broken')],
            ['MANIFEST_NON_REGISTRY', (d) => {
                const p = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8'));
                p.dependencies['@salonbw/api'] = 'file:./packages/api';
                fs.writeFileSync(path.join(d, 'package.json'), JSON.stringify(p));
            }],
            ['CONFIG_CONFLICT', (d) => fs.writeFileSync(path.join(d, '.env.runtime.json'), '{}')],
        ];
        for (const [code, mutate] of cases) {
            const artifact = makeArtifact(sb.base, { sha: SHA_B, mutate });
            await assert.rejects(prep(SHA_B, { artifact }), expectCode(code));
            assert.deepEqual(releaseDirs(), [], `${code}: nothing published`);
        }
        await assert.rejects(activate(SHA_B, recordingAdapter()), expectCode('RELEASE_MISSING'));
    });

    test('digest mismatch and missing digest stop before extraction', async () => {
        await assert.rejects(prep(SHA_A, { archiveSha256: 'f'.repeat(64) }), expectCode('ARCHIVE_DIGEST_MISMATCH'));
        await assert.rejects(prep(SHA_A, { archiveSha256: '' }), expectCode('ARCHIVE_DIGEST_REQUIRED'));
        assert.deepEqual(releaseDirs(), []);
    });

    test('failure during extraction leaves the active release untouched', async () => {
        await prep(SHA_A);
        await activate(SHA_A, recordingAdapter());
        const before = treeHash(path.join(sb.root, 'releases', SHA_A)).hash;
        const hooks = { step: (n) => { if (n === 'extract:after') throw Object.assign(new Error('disk full'), { code: 'ENOSPC' }); } };
        await assert.rejects(prep(SHA_B, { hooks }), expectCode('ENOSPC'));
        assert.deepEqual(releaseDirs(), [SHA_A]);
        assert.equal(readPointer(sb.root, 'current'), SHA_A);
        assert.equal(treeHash(path.join(sb.root, 'releases', SHA_A)).hash, before);
        assert.ok(!fs.existsSync(path.join(sb.root, '.lock')), 'lock released');
    });

    test('failed and partial dependency installs are discarded; retry works', async () => {
        await prep(SHA_A);
        await activate(SHA_A, recordingAdapter());
        const failing = fakeInstaller({ failTimes: 1 });
        await assert.rejects(prep(SHA_B, { depVersion: '2.0.0', inst: failing }), expectCode('INSTALL_FAILED'));
        const partial = fakeInstaller({ skipPackageJsonFor: 'synthetic-dep' });
        await assert.rejects(prep(SHA_B, { depVersion: '2.0.0', inst: partial }), expectCode('DEPS_INCOMPLETE'));
        assert.equal(depsDirs().length, 1, 'no half-installed dependency set survives');
        assert.deepEqual(releaseDirs(), [SHA_A]);
        verify(SHA_A);
        assert.equal((await prep(SHA_B, { depVersion: '2.0.0', inst: failing })).status, 'prepared');
    });

    test('tampered or corrupted releases fail verification and activation', async () => {
        await prep(SHA_A);
        await prep(SHA_B, { depVersion: '2.0.0' });
        fs.appendFileSync(path.join(sb.root, 'releases', SHA_B, '.next', 'BUILD_ID'), 'x');
        assert.throws(() => verify(SHA_B), expectCode('RELEASE_TAMPERED'));
        await assert.rejects(activate(SHA_B, recordingAdapter()), expectCode('RELEASE_TAMPERED'));
        const fp = JSON.parse(fs.readFileSync(path.join(sb.root, 'releases', SHA_A, 'release.json'), 'utf8')).fingerprint;
        fs.rmSync(path.join(sb.root, 'deps', fp, 'node_modules', 'synthetic-dep', 'package.json'));
        assert.throws(() => verify(SHA_A), expectCode('DEPS_INCOMPLETE'));
    });

    test('invalid rollback targets are refused', async () => {
        const adapter = recordingAdapter();
        await assert.rejects(rollback(adapter), expectCode('ROLLBACK_NO_TARGET'));
        await prep(SHA_A);
        await prep(SHA_B, { depVersion: '2.0.0' });
        await activate(SHA_A, adapter);
        await assert.rejects(rollback(adapter), expectCode('ROLLBACK_NO_TARGET'));
        await activate(SHA_B, adapter);
        fs.rmSync(path.join(sb.root, 'releases', SHA_A, 'release.json'));
        await assert.rejects(rollback(adapter), expectCode('RELEASE_INCOMPLETE'));
        assert.equal(readPointer(sb.root, 'current'), SHA_B, 'current unchanged after refused rollback');
        fs.rmSync(path.join(sb.root, 'previous'));
        fs.symlinkSync('../../etc', path.join(sb.root, 'previous'));
        await assert.rejects(rollback(adapter), expectCode('POINTER_INVALID'));
    });

    test('failure after the activation boundary auto-restores the previous release', async () => {
        await prep(SHA_A);
        await prep(SHA_B, { depVersion: '2.0.0' });
        await activate(SHA_A, recordingAdapter());
        const adapter = recordingAdapter({ failHealthFor: SHA_B });
        await assert.rejects(activate(SHA_B, adapter), expectCode('ACTIVATION_ROLLED_BACK'));
        assert.deepEqual([readPointer(sb.root, 'current'), readPointer(sb.root, 'previous')], [SHA_A, null]);
        assert.deepEqual(adapter.calls, [['restart', SHA_B], ['health', SHA_B], ['restart', SHA_A], ['health', SHA_A]]);
    });

    test('failure before the activation boundary changes nothing', async () => {
        await prep(SHA_A);
        await prep(SHA_B, { depVersion: '2.0.0' });
        await activate(SHA_A, recordingAdapter());
        const adapter = recordingAdapter();
        const hooks = { step: (n) => { if (n === 'activate:before-switch') throw new Error('crash before switch'); } };
        await assert.rejects(activate(SHA_B, adapter, hooks));
        assert.equal(readPointer(sb.root, 'current'), SHA_A);
        assert.deepEqual(adapter.calls, []);
    });

    test('concurrent deployment attempts are serialized by the lock', async () => {
        const art = makeArtifact(sb.base, { sha: SHA_A });
        const slow = fakeInstaller({ delayMs: 100 });
        const first = prep(SHA_A, { artifact: art, inst: slow });
        await assert.rejects(prep(SHA_B, { inst: slow }), expectCode('LOCKED'));
        await first;
        assert.deepEqual(releaseDirs(), [SHA_A]);
    });
});
