#!/usr/bin/env node
// DEV ONLY: switch a fixed, real Passenger app directory to a verified
// staged release. Automatic rollback on restart/HTTP smoke failure.
// Never touches production, data stores, or the provider's backup service.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const validSha = s => /^[0-9a-f]{40}$/.test(s || '');
const state = p => { try { return fs.lstatSync(p); } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
} };
const realDirectory = p => state(p)?.isDirectory() && !state(p)?.isSymbolicLink();
const file = p => state(p)?.isFile() && !state(p)?.isSymbolicLink();
const must = (ok, reason) => { if (!ok) throw new Error(reason); };
const allowedReasons = new Set([
    'invalid-arguments','invalid-home','unexpected-host','unexpected-root',
    'live-root-mismatch','domain-link-mismatch','unexpected-release',
    'source-receipt-mismatch','staged-runtime-missing','previous-release-exists',
    'previous-release-missing','archive-missing','archive-permissions',
    'cross-filesystem-rename','runtime-permissions','runtime-config-mismatch',
    'release-metadata-mismatch','lock-unavailable','restart-failed',
    'live-http-verification-failed','live-release-mismatch',
    'unexpected-recovery-state','staging-target-collision','interrupted',
    'unapproved-activation','runtime-not-verified','rollback-failed',
]);
const safeReason = e => allowedReasons.has(e?.message) ? e.message : 'unclassified-host-operation-failure';
const liveDomain = 'dev-panel.salon-bw.pl';
const api = 'https://dev-api.salon-bw.pl';

function paths(home, newSha, oldSha) {
    must(path.isAbsolute(home) && home !== '/', 'invalid-home');
    const root = path.join(home, '.salonbw-manual');
    return {
        home, root,
        live: path.join(home, 'apps/nodejs/panelbw_dev'),
        domain: path.join(home, 'domains', liveDomain, 'public_nodejs'),
        stage: path.join(root, 'staged-panel', newSha),
        previousParent: path.join(root, 'previous-panel'),
        previous: path.join(root, 'previous-panel', oldSha + '-before-' + newSha),
        source: path.join(root, 'sources', newSha),
        archive: path.join(root, 'panelbw_dev-predeploy-20261113-192747.tar.gz'),
        lock: path.join(root, 'locks/panel-activation'),
        locks: path.join(root, 'locks'),
    };
}
function validateDomain(p) {
    must(state(p.domain)?.isSymbolicLink(), 'domain-link-mismatch');
    // resolve the *link itself*, even if a hard crash left it temporarily dangling
    const linkTarget = fs.readlinkSync(p.domain);
    const absolute = path.resolve(path.dirname(p.domain), linkTarget);
    // FreeBSD hosting may expose the same physical home as /home and
    // /usr/home. Compare canonical parent directories, even when an SSH
    // interruption left the expected application leaf temporarily absent.
    const expected = path.join(
        fs.realpathSync(path.dirname(p.live)), path.basename(p.live),
    );
    const actual = path.join(
        fs.realpathSync(path.dirname(absolute)), path.basename(absolute),
    );
    must(actual === expected, 'domain-link-mismatch');
}
function readRelease(dir, expected) {
    must(realDirectory(dir), 'staged-runtime-missing');
    const releasePath = path.join(dir, 'public/__release.json');
    const configPath = path.join(dir, '.env.runtime.json');
    const buildPath = path.join(dir, '.next/BUILD_ID');
    must(file(releasePath) && file(configPath) && file(buildPath) &&
        file(path.join(dir,'app.cjs')) &&
        file(path.join(dir,'node_modules/next/package.json')), 'runtime-not-verified');
    const st = state(configPath);
    must(st.size <= 16384 && (st.mode & 0o077) === 0, 'runtime-permissions');
    const release = JSON.parse(fs.readFileSync(releasePath,'utf8'));
    const config = JSON.parse(fs.readFileSync(configPath,'utf8'));
    const buildId = fs.readFileSync(buildPath,'utf8').trim();
    must(release.sha === expected && release.buildId === buildId &&
        release.environment === 'development' && release.api === api,
        'release-metadata-mismatch');
    must(config.APP_ENV === 'development' && config.APP_RELEASE === expected &&
        config.API_PROXY_URL === api &&
        config.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' &&
        config.NEXT_PUBLIC_AUTH_COOKIE_PREFIX === 'dev_' &&
        !!config.DEV_ACCESS_USER && !!config.DEV_ACCESS_PASSWORD,
        'runtime-config-mismatch');
    return {config,buildId};
}
function validateBeforeSwitch(p, newSha, oldSha) {
    must(realDirectory(p.root) && realDirectory(path.dirname(p.live)) &&
        realDirectory(path.dirname(p.stage)) && realDirectory(p.locks),
        'unexpected-root');
    validateDomain(p);
    must(realDirectory(p.live), 'live-root-mismatch');
    must(!state(p.previous), 'previous-release-exists');
    must(file(path.join(p.source,'.salonbw-source-sha')) &&
        fs.readFileSync(path.join(p.source,'.salonbw-source-sha'),'utf8').trim() === newSha,
        'source-receipt-mismatch');
    const archiveState = state(p.archive);
    must(archiveState?.isFile() && !archiveState.isSymbolicLink() && archiveState.size > 0,
        'archive-missing');
    must((archiveState.mode & 0o077) === 0, 'archive-permissions');
    readRelease(p.live, oldSha);
    readRelease(p.stage, newSha);
    const liveDevice = fs.statSync(p.live).dev;
    must(liveDevice === fs.statSync(p.stage).dev &&
        liveDevice === fs.statSync(p.root).dev,
        'cross-filesystem-rename');
}
function renameNoOverwrite(from, to) {
    must(!state(to), 'staging-target-collision');
    fs.renameSync(from,to);
}
function acquireLock(p) {
    must(realDirectory(p.locks), 'unexpected-root');
    try { fs.mkdirSync(p.lock, {mode:0o700}); }
    catch { throw new Error('lock-unavailable'); }
}
function releaseLock(p) {
    try { fs.rmdirSync(p.lock); } catch {
        // Keep stale lock for manual recovery; never remove someone else's.
    }
}

export async function activatePanel(home, newSha, oldSha, actions) {
    must(validSha(newSha) && validSha(oldSha) && newSha !== oldSha,'invalid-arguments');
    const p = paths(home,newSha,oldSha);
    validateBeforeSwitch(p,newSha,oldSha);
    acquireLock(p);
    let switched = false;
    let previousMoved = false;
    try {
        // This is not a single atomic swap. If the process dies between
        // renames, --recover restores the old real directory without tar.
        must(!state(p.previousParent) || realDirectory(p.previousParent),
            'unexpected-root');
        if (!state(p.previousParent)) fs.mkdirSync(p.previousParent,{mode:0o700});
        renameNoOverwrite(p.live,p.previous);
        previousMoved = true;
        renameNoOverwrite(p.stage,p.live);
        switched = true;
        await actions.restart();
        await actions.verify(newSha,p.live);
        return {status:'PASS',previous:p.previous,live:p.live};
    } catch(error) {
        if (previousMoved) {
            try {
                if (switched && realDirectory(p.live)) {
                    // Return new release to its previously empty stage path.
                    renameNoOverwrite(p.live,p.stage);
                }
                if (!state(p.live) && realDirectory(p.previous)) {
                    renameNoOverwrite(p.previous,p.live);
                }
                must(realDirectory(p.live),'rollback-failed');
                readRelease(p.live,oldSha);
                await actions.restart();
                await actions.verify(oldSha,p.live);
            } catch {
                throw new Error('rollback-failed');
            }
        }
        throw error;
    } finally {
        releaseLock(p);
    }
}

export async function recoverPanel(home,newSha,oldSha,actions) {
    must(validSha(newSha) && validSha(oldSha) && newSha !== oldSha,'invalid-arguments');
    const p = paths(home,newSha,oldSha);
    must(realDirectory(p.root) && realDirectory(p.locks) &&
        realDirectory(path.dirname(p.live)),'unexpected-root');
    validateDomain(p);
    acquireLock(p);
    try {
        if (realDirectory(p.live) && !state(p.previous)) {
            readRelease(p.live,oldSha);
            return {status:'ALREADY_OLD'};
        }
        must(realDirectory(p.previous),'previous-release-missing');
        readRelease(p.previous,oldSha);
        if (state(p.live)) {
            readRelease(p.live,newSha);
            renameNoOverwrite(p.live,p.stage);
        }
        renameNoOverwrite(p.previous,p.live);
        await actions.restart();
        await actions.verify(oldSha,p.live);
        return {status:'RECOVERED'};
    } finally {
        releaseLock(p);
    }
}

async function remoteVerify(sha,live) {
    const {config,buildId} = readRelease(live,sha);
    const authorization='Basic '+Buffer.from(
        config.DEV_ACCESS_USER+':'+config.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    let ok=false;
    for (let retry=0;retry<20;retry++) {
        try {
            const common={
                redirect:'manual',
                cache:'no-store',
                headers:{Authorization:authorization,'Cache-Control':'no-cache'},
                signal:AbortSignal.timeout(6000),
            };
            const release=await fetch('https://'+liveDomain+'/__release.json?check='+Date.now(),common);
            if (release.status===200) {
                const data=await release.json();
                if(data.sha!==sha||data.buildId!==buildId||
                    data.environment!=='development'||data.api!==api) {
                    throw new Error('live-release-mismatch');
                }
                const login=await fetch('https://'+liveDomain+'/auth/login',common);
                if(login.status!==200) throw new Error('live-http-verification-failed');
                const html=await login.text();
                if(!html.includes(buildId))throw new Error('live-http-verification-failed');
                ok=true;
                break;
            }
        } catch {
            // Passenger may need several startup attempts after restart.
        }
        await new Promise(resolve=>setTimeout(resolve,1500));
    }
    must(ok,'live-http-verification-failed');
}

function passengerRestart() {
    const result=spawnSync('devil',['www','restart',liveDomain],{
        encoding:'utf8',stdio:'ignore',timeout:30000,
    });
    must(!result.error && result.status===0,'restart-failed');
}

// Can be invoked as a local file or piped via strict SSH into
// `node22 --input-type=module - ...`; imports from unit tests do nothing.
if (process.argv[1] === '-' ||
    (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)) {
    const [newSha,oldSha,mode] = process.argv.slice(2);
    try {
        must(validSha(newSha) && validSha(oldSha) && newSha!==oldSha &&
            ['--plan','--execute','--recover'].includes(mode),'invalid-arguments');
        const home=process.env.HOME;
        must(home && path.isAbsolute(home),'invalid-home');
        const p=paths(home,newSha,oldSha);
        if (mode==='--plan') {
            validateBeforeSwitch(p,newSha,oldSha);
            console.log('DEV_PANEL_ACTIVATION_PLAN=PASS');
            console.log('EXPECTED_LIVE_SHA='+oldSha);
            console.log('STAGED_SHA='+newSha);
            console.log('LIVE_RUNTIME_MUTATIONS=NONE');
            console.log('ACTIVATION=NOT_STARTED');
        } else {
            must(process.env.SALONBW_DEV_PANEL_APPROVED_SHA===newSha,
                'unapproved-activation');
            const actions={restart:passengerRestart,verify:remoteVerify};
            const result=mode==='--execute'
                ? await activatePanel(home,newSha,oldSha,actions)
                : await recoverPanel(home,newSha,oldSha,actions);
            console.log(mode==='--execute'?'DEV_PANEL_ACTIVATION='+result.status:
                'DEV_PANEL_RECOVERY='+result.status);
            console.log('CURRENT_SHA='+ (mode==='--execute'?newSha:oldSha));
            console.log('PASSENGER_HTTP_SMOKE=PASS');
            console.log('PRODUCTION_MUTATIONS=NONE');
        }
    } catch(error) {
        console.error('DEV_PANEL_ACTIVATION=BLOCKED reason='+safeReason(error));
        if(safeReason(error)==='rollback-failed') {
            console.error('MANUAL_RECOVERY_REQUIRED=YES');
        }
        process.exitCode=1;
    }
}
