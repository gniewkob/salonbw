#!/usr/bin/env node
// DEV ONLY: switch the fixed, real dev.salon-bw.pl landing directory to a
// verified staged release. Automatic rollback on restart/HTTP smoke failure.
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
    'unapproved-activation','runtime-not-verified','rollback-failed','staged-runtime-not-web-readable',
]);
const safeReason = e => allowedReasons.has(e?.message) ? e.message : 'unclassified-host-operation-failure';
const liveDomain = 'dev.salon-bw.pl';
const api = 'https://dev-api.salon-bw.pl';

function paths(home, newSha, oldSha) {
    must(path.isAbsolute(home) && home !== '/', 'invalid-home');
    const root = path.join(home, '.salonbw-manual');
    return {
        home, root,
        live: path.join(home, 'apps/nodejs/salonbw'),
        domain: path.join(home, 'domains', liveDomain, 'public_nodejs'),
        stage: path.join(root, 'staged-landing', newSha),
        previousParent: path.join(root, 'previous-landing'),
        previous: path.join(root, 'previous-landing', oldSha + '-before-' + newSha),
        source: path.join(root, 'sources', newSha),
        lock: path.join(root, 'locks/landing-activation'),
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
// The landing deployed before this manual channel (e.g. 58610f7c, built by
// the GitHub workflow on 2026-11-05) has no public/__release.json. Such a
// LEGACY release is identified by its private APP_RELEASE plus BUILD_ID and
// is only accepted as the *previous* release, never as a staged candidate.
function readRelease(dir, expected, {allowLegacy=false}={}) {
    must(realDirectory(dir), 'staged-runtime-missing');
    const releasePath = path.join(dir, 'public/__release.json');
    const configPath = path.join(dir, '.env.runtime.json');
    const buildPath = path.join(dir, '.next/BUILD_ID');
    const hasRelease = file(releasePath);
    must((hasRelease || allowLegacy) && file(configPath) && file(buildPath) &&
        file(path.join(dir,'app.cjs')) &&
        file(path.join(dir,'node_modules/next/package.json')), 'runtime-not-verified');
    const st = state(configPath);
    must(st.size <= 16384 && (st.mode & 0o077) === 0, 'runtime-permissions');
    const config = JSON.parse(fs.readFileSync(configPath,'utf8'));
    const buildId = fs.readFileSync(buildPath,'utf8').trim();
    must(/^[A-Za-z0-9_-]{8,64}$/.test(buildId), 'release-metadata-mismatch');
    if (hasRelease) {
        const release = JSON.parse(fs.readFileSync(releasePath,'utf8'));
        must(release.sha === expected && release.buildId === buildId &&
            release.environment === 'development' && release.api === api,
            'release-metadata-mismatch');
    }
    must(config.APP_ENV === 'development' && config.APP_RELEASE === expected &&
        config.API_PROXY_URL === api &&
        config.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' &&
        config.NEXT_PUBLIC_AUTH_COOKIE_PREFIX === 'dev_' &&
        !!config.DEV_ACCESS_USER && !!config.DEV_ACCESS_PASSWORD,
        'runtime-config-mismatch');
    return {config,buildId,hasRelease};
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
    // No owner archive is required: the old directory is MOVED (not copied)
    // to previous-landing and stays intact as the rollback source.
    readRelease(p.live, oldSha, {allowLegacy:true});
    readRelease(p.stage, newSha);
    // MyDevil serves /public as static assets via its web server. A release
    // extracted with umask 077 can pass Node-only smoke but fail hosted HTTP.
    // Validate the future live permissions BEFORE renaming either directory.
    for (const relative of ['', 'public', '.next', 'node_modules']) {
        const stat=state(path.join(p.stage,relative));
        must(stat?.isDirectory()&&!stat.isSymbolicLink()&&
            (stat.mode&0o055)===0o055,'staged-runtime-not-web-readable');
    }
    for (const relative of ['public/__release.json','app.js','app.cjs',
        '.next/BUILD_ID','node_modules/next/package.json']) {
        const stat=state(path.join(p.stage,relative));
        must(stat?.isFile()&&!stat.isSymbolicLink()&&
            (stat.mode&0o044)===0o044,'staged-runtime-not-web-readable');
    }
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

export async function activateLanding(home, newSha, oldSha, actions) {
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
                readRelease(p.live,oldSha,{allowLegacy:true});
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

export async function recoverLanding(home,newSha,oldSha,actions) {
    must(validSha(newSha) && validSha(oldSha) && newSha !== oldSha,'invalid-arguments');
    const p = paths(home,newSha,oldSha);
    must(realDirectory(p.root) && realDirectory(p.locks) &&
        realDirectory(path.dirname(p.live)),'unexpected-root');
    validateDomain(p);
    acquireLock(p);
    try {
        if (realDirectory(p.live) && !state(p.previous)) {
            readRelease(p.live,oldSha,{allowLegacy:true});
            return {status:'ALREADY_OLD'};
        }
        must(realDirectory(p.previous),'previous-release-missing');
        readRelease(p.previous,oldSha,{allowLegacy:true});
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

// Report only a finite phase, error category and HTTP status. Never report
// response bodies, Authorization headers, URLs, credentials or raw exceptions.
// A categorized receipt is crucial because Passenger startup and CDN/routing
// failures can look identical when only the final boolean is retained.
export async function remoteVerify(sha,live,{
    request=fetch,
    maxAttempts=20,
    sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
    diagnostic=line=>console.error(line),
}={}) {
    const {config,buildId,hasRelease}=readRelease(live,sha,{allowLegacy:true});
    const authorization='Basic '+Buffer.from(
        config.DEV_ACCESS_USER+':'+config.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    must(Number.isInteger(maxAttempts)&&maxAttempts>=1&&maxAttempts<=20,
        'invalid-arguments');
    let last={phase:'NOT_STARTED',category:'UNKNOWN',status:'NONE'};
    const attempts=new Map();
    for(let retry=0;retry<maxAttempts;retry++){
        let phase=hasRelease?'RELEASE_FETCH':'HOME_FETCH';
        let status='NONE';
        try{
            const common={
                redirect:'manual',
                cache:'no-store',
                headers:{Authorization:authorization,'Cache-Control':'no-cache'},
                signal:AbortSignal.timeout(6000),
            };
            if(hasRelease){
                const release=await request(
                    'https://'+liveDomain+'/__release.json?check='+Date.now(),common);
                phase='RELEASE_HTTP';
                status=Number.isInteger(release.status)&&
                    release.status>=100&&release.status<=599
                    ? String(release.status):'UNKNOWN';
                if(release.status!==200)throw Error('http-status');
                phase='RELEASE_JSON';
                const data=await release.json();
                phase='RELEASE_METADATA';
                if(data.sha!==sha||data.buildId!==buildId||
                    data.environment!=='development'||data.api!==api){
                    throw Error('release-mismatch');
                }
                phase='HOME_FETCH';
            }
            const home=await request('https://'+liveDomain+'/?check='+Date.now(),common);
            phase='HOME_HTTP';
            status=Number.isInteger(home.status)&&
                home.status>=100&&home.status<=599
                ? String(home.status):'UNKNOWN';
            if(home.status!==200)throw Error('http-status');
            phase='HOME_HTML';
            const html=await home.text();
            if(!html.includes(buildId))throw Error('build-mismatch');
            return;
        }catch(error){
            const category=error?.message==='http-status'?'HTTP_STATUS':
                error?.message==='release-mismatch'?'RELEASE_MISMATCH':
                error?.message==='build-mismatch'?'HOME_BUILD_MISMATCH':
                ['TimeoutError','AbortError'].includes(error?.name)?'TIMEOUT':
                error instanceof SyntaxError?'INVALID_RESPONSE':
                'TRANSPORT_OR_RUNTIME';
            last={phase,category,status};
            const key=phase+':'+category+':'+status;
            attempts.set(key,(attempts.get(key)||0)+1);
        }
        if(retry<maxAttempts-1)await sleep(1500);
    }
    // The bounded summary distinguishes persistent vs transient failures.
    const counts=[...attempts.entries()].map(([key,count])=>key+'='+count).join(',');
    diagnostic('DEV_LANDING_HTTP_DIAG=BLOCKED target_sha='+sha+
        ' phase='+last.phase+' category='+last.category+
        ' http_status='+last.status+' attempts='+maxAttempts);
    diagnostic('DEV_LANDING_HTTP_DIAG_COUNTS='+counts);
    throw Error('live-http-verification-failed');
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
            console.log('DEV_LANDING_ACTIVATION_PLAN=PASS');
            console.log('EXPECTED_LIVE_SHA='+oldSha);
            console.log('STAGED_SHA='+newSha);
            console.log('LIVE_RUNTIME_MUTATIONS=NONE');
            console.log('ACTIVATION=NOT_STARTED');
        } else {
            must(process.env.SALONBW_DEV_LANDING_APPROVED_SHA===newSha,
                'unapproved-activation');
            const actions={restart:passengerRestart,verify:remoteVerify};
            const result=mode==='--execute'
                ? await activateLanding(home,newSha,oldSha,actions)
                : await recoverLanding(home,newSha,oldSha,actions);
            console.log(mode==='--execute'?'DEV_LANDING_ACTIVATION='+result.status:
                'DEV_LANDING_RECOVERY='+result.status);
            console.log('CURRENT_SHA='+ (mode==='--execute'?newSha:oldSha));
            console.log('PASSENGER_HTTP_SMOKE=PASS');
            console.log('PRODUCTION_MUTATIONS=NONE');
        }
    } catch(error) {
        console.error('DEV_LANDING_ACTIVATION=BLOCKED reason='+safeReason(error));
        if(safeReason(error)==='rollback-failed') {
            console.error('MANUAL_RECOVERY_REQUIRED=YES');
        }
        process.exitCode=1;
    }
}
