// E2E: a mock Passenger runtime serves real HTTP from `current` while
// releases are prepared, activated, failed and rolled back. Local only.
// It cannot prove MyDevil/Passenger semantics (see docs/SAFE_RELEASE_DESIGN.md).
// Run: node --test scripts/ci/safe-release.e2e.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { activateRelease, diskUsageBytes, prepareRelease, readPointer, rollbackRelease } from './safe-release.mjs';
import { MockPassenger, PLATFORM, fakeInstaller, makeArtifact, makeSandbox, shaOf, sleep } from './safe-release-testkit.mjs';

const SHA_A = shaOf('e2e-A');
const SHA_B = shaOf('e2e-B');
const SHA_C = shaOf('e2e-C');
const EXPECTED = { [SHA_A]: '1.0.0', [SHA_B]: '2.0.0', [SHA_C]: '2.0.0' };

describe('e2e: mock Passenger runtime', () => {
    let sb;
    let runtime;
    let inst;
    const ctx = () => ({ root: sb.root, allowedRoot: sb.allowedRoot, platform: PLATFORM });
    const prep = (sha, { hooks, installer = inst.installer } = {}) => {
        const art = makeArtifact(sb.base, { sha, depVersion: EXPECTED[sha] });
        return prepareRelease({ ...ctx(), sha, archivePath: art.archivePath, archiveSha256: art.archiveSha256, sharedConfig: ['.env.runtime.json'], installer, hooks });
    };

    // Polls continuously; every response must be a complete, consistent release.
    function startPoller() {
        const seen = [];
        let stop = false;
        const loop = (async () => {
            while (!stop) {
                const { status, body } = await runtime.get();
                seen.push({ status, ...body });
                await sleep(2);
            }
        })();
        return {
            seen,
            stop: async () => {
                stop = true;
                await loop;
                return seen;
            },
        };
    }
    const assertConsistent = (seen) => {
        for (const r of seen) {
            assert.equal(r.status, 200);
            assert.ok(EXPECTED[r.sha], `unknown release served: ${r.sha}`);
            assert.equal(r.dep, EXPECTED[r.sha], 'code and dependencies come from the same release');
            assert.equal(r.build, `build-${r.sha.slice(0, 8)}`);
            assert.equal(r.env, 'development');
        }
    };

    beforeEach(async () => {
        sb = makeSandbox();
        inst = fakeInstaller();
        runtime = new MockPassenger(sb.root);
        await prep(SHA_A);
        await activateRelease({ ...ctx(), sha: SHA_A, adapter: runtime.adapter() });
    });
    afterEach(() => {
        runtime.stop();
        sb.cleanup();
    });

    test('1+5: active release keeps serving while another is prepared; incomplete state is never observed', async () => {
        const poller = startPoller();
        let stagingObserved = false;
        const hooks = {
            step: async (name) => {
                // Hold each intermediate (incomplete) state while requests flow.
                if (['extract:after', 'deps:before-install', 'publish:before'].includes(name)) {
                    stagingObserved ||= fs.readdirSync(path.join(sb.root, 'releases')).some((n) => n.startsWith('.staging-'));
                    await sleep(60);
                }
            },
        };
        await prep(SHA_B, { hooks });
        const seen = await poller.stop();
        assert.ok(stagingObserved, 'staging directory existed during preparation');
        assert.ok(seen.length >= 20, `enough concurrent requests (${seen.length})`);
        assertConsistent(seen);
        assert.ok(seen.every((r) => r.sha === SHA_A), 'only the active release was served');
        assert.equal(runtime.restarts, 1, 'preparation never restarts the runtime');
    });

    test('2: failed preparation does not modify the active release', async () => {
        const poller = startPoller();
        await assert.rejects(prep(SHA_B, { installer: fakeInstaller({ failTimes: 1 }).installer }));
        await assert.rejects(prep(SHA_B, { hooks: { step: (n) => { if (n === 'extract:after') throw new Error('injected'); } } }));
        const seen = await poller.stop();
        assertConsistent(seen);
        assert.ok(seen.every((r) => r.sha === SHA_A));
        assert.equal(readPointer(sb.root, 'current'), SHA_A);
        assert.deepEqual(fs.readdirSync(path.join(sb.root, 'releases')), [SHA_A]);
    });

    test('3: successful activation serves the intended new release', async () => {
        await prep(SHA_B);
        const poller = startPoller();
        await activateRelease({ ...ctx(), sha: SHA_B, adapter: runtime.adapter() });
        await sleep(30);
        const seen = await poller.stop();
        assertConsistent(seen); // only whole A or whole B, never mixed
        assert.equal(seen.at(-1).sha, SHA_B);
        const firstB = seen.findIndex((r) => r.sha === SHA_B);
        assert.ok(seen.slice(firstB).every((r) => r.sha === SHA_B), 'no flapping back to A after switch');
        assert.equal((await runtime.get()).body.dep, '2.0.0');
    });

    test('4: failed activation (health) recovers automatically; crash after switch recovers via rollback', async () => {
        await prep(SHA_B);
        await assert.rejects(activateRelease({ ...ctx(), sha: SHA_B, adapter: runtime.adapter({ failHealthFor: SHA_B }) }), (e) => e.code === 'ACTIVATION_ROLLED_BACK' && e.recovered);
        assert.equal((await runtime.get()).body.sha, SHA_A);
        assert.equal(readPointer(sb.root, 'current'), SHA_A);

        // Simulated deploy-process death right after the pointer switch:
        // pointer says B, running worker still serves A (no restart happened).
        await assert.rejects(activateRelease({ ...ctx(), sha: SHA_B, adapter: runtime.adapter(), hooks: { step: (n) => { if (n === 'activate:after-switch') throw new Error('runner killed'); } } }));
        assert.equal(readPointer(sb.root, 'current'), SHA_B);
        assert.equal((await runtime.get()).body.sha, SHA_A, 'old worker unaffected by pointer switch');
        await rollbackRelease({ ...ctx(), adapter: runtime.adapter() });
        assert.equal(readPointer(sb.root, 'current'), SHA_A);
        assert.equal((await runtime.get()).body.sha, SHA_A);
    });

    test('6+7: dependency reuse vs isolated install, plus local resource metrics', async () => {
        const t0 = performance.now();
        const reuse = await prep(SHA_C); // C introduces dep 2.0.0 → new fingerprint
        const t1 = performance.now();
        assert.deepEqual(reuse.stats, { installs: 1, reused: 0 }, 'changed fingerprint → isolated install');
        const before = inst.state.calls;
        const t2 = performance.now();
        const b = await prep(SHA_B); // same dependency fingerprint as C
        const t3 = performance.now();
        assert.deepEqual(b.stats, { installs: 0, reused: 1 }, 'unchanged fingerprint → no install');
        assert.equal(inst.state.calls, before);
        await activateRelease({ ...ctx(), sha: SHA_B, adapter: runtime.adapter() });
        await rollbackRelease({ ...ctx(), adapter: runtime.adapter() });
        await activateRelease({ ...ctx(), sha: SHA_B, adapter: runtime.adapter() });
        assert.equal((await runtime.get()).body.sha, SHA_B);
        const metrics = {
            installerCalls: inst.state.calls,
            preparesWithInstall: 2,
            preparesReused: 1,
            coldPrepareMs: Math.round(t1 - t0),
            warmPrepareMs: Math.round(t3 - t2),
            releasesBytes: diskUsageBytes(path.join(sb.root, 'releases')),
            depsBytes: diskUsageBytes(path.join(sb.root, 'deps')),
            dependencySets: fs.readdirSync(path.join(sb.root, 'deps')).length,
        };
        console.log(`SAFE_RELEASE_METRICS ${JSON.stringify(metrics)}`);
        assert.equal(metrics.dependencySets, 2);
    });
});
