import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { activateLanding, recoverLanding, remoteVerify } from '../mydevil/manual-dev-landing-activate.mjs';

const script=fileURLToPath(new URL('../mydevil/manual-dev-landing-activate.mjs',import.meta.url));
const old='b'.repeat(40), fresh='a'.repeat(40);
async function fixture(run) {
    const parent=fs.mkdtempSync(path.join(os.tmpdir(),'salonbw-landing-activation-test-'));
    const home=path.join(parent,'home'), root=path.join(home,'.salonbw-manual');
    const live=path.join(home,'apps/nodejs/salonbw');
    const stage=path.join(root,'staged-landing',fresh);
    const previous=path.join(root,'previous-landing',old+'-before-'+fresh);
    const linkDir=path.join(home,'domains/dev.salon-bw.pl');
    fs.mkdirSync(path.join(root,'locks'),{recursive:true});
    fs.mkdirSync(path.join(root,'sources',fresh),{recursive:true});
    fs.mkdirSync(linkDir,{recursive:true});
    fs.writeFileSync(path.join(root,'sources',fresh,'.salonbw-source-sha'),fresh+'\n');
    function app(dir,sha) {
        fs.mkdirSync(path.join(dir,'node_modules/next'),{recursive:true});
        fs.mkdirSync(path.join(dir,'.next'),{recursive:true});
        fs.mkdirSync(path.join(dir,'public'),{recursive:true});
        const build='SyntheticBuild12345';
        fs.writeFileSync(path.join(dir,'public/__release.json'),JSON.stringify({
            sha,environment:'development',api:'https://dev-api.salon-bw.pl',buildId:build,
        }));
        fs.writeFileSync(path.join(dir,'.next/BUILD_ID'),build);
        fs.writeFileSync(path.join(dir,'app.cjs'),'// synthetic\n');
        fs.writeFileSync(path.join(dir,'app.js'),'// synthetic\n');
        fs.writeFileSync(path.join(dir,'node_modules/next/package.json'),'{}');
        for(const relative of ['', 'public', '.next', 'node_modules']) {
            fs.chmodSync(path.join(dir,relative),0o755);
        }
        for(const relative of ['public/__release.json','app.js','app.cjs',
            '.next/BUILD_ID','node_modules/next/package.json']) {
            fs.chmodSync(path.join(dir,relative),0o644);
        }
        fs.writeFileSync(path.join(dir,'.env.runtime.json'),JSON.stringify({
            APP_RELEASE:sha, APP_ENV:'development',
            API_PROXY_URL:'https://dev-api.salon-bw.pl',
            NEXT_PUBLIC_DEPLOYMENT_ENV:'development',
            NEXT_PUBLIC_AUTH_COOKIE_PREFIX:'dev_',
            DEV_ACCESS_USER:'test',DEV_ACCESS_PASSWORD:'TEST_SECRET_NOT_FOR_OUTPUT',
        }),{mode:0o600});
    }
    app(live,old);
    app(stage,fresh);
    fs.symlinkSync(live,path.join(linkDir,'public_nodejs'));
    try { return await run({home,root,live,stage,previous,linkDir,app}); }
    finally {fs.rmSync(parent,{recursive:true,force:true});}
}
const release=(p)=>JSON.parse(fs.readFileSync(path.join(p,'public/__release.json'),'utf8')).sha;
test('DEV activation atomically renames each directory and keeps old release',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        let restarted=0,verified=0;
        const result=await activateLanding(home,fresh,old,{
            restart:async()=>{restarted++},
            verify:async(s,p)=>{assert.equal(s,fresh);assert.equal(release(p),fresh);verified++},
        });
        assert.equal(result.status,'PASS');
        assert.equal(restarted,1);
        assert.equal(verified,1);
        assert.equal(release(live),fresh);
        assert.equal(release(previous),old);
        assert.equal(fs.existsSync(stage),false);
    });
});
test('failed live HTTP smoke triggers immediate old-release restoration',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        let restarted=0;
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{restarted++},
            verify:async(s)=>{if(s===fresh)throw new Error('live-http-verification-failed');},
        }),/live-http-verification-failed/);
        assert.equal(restarted,2);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
        assert.equal(fs.existsSync(previous),false);
    });
});
test('failed Passenger restart triggers restoration and second restart',async()=>{
    await fixture(async ({home,live,stage})=>{
        let restarted=0;
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{restarted++;if(restarted===1)throw new Error('restart-failed')},
            verify:async(s)=>{assert.equal(s,old)},
        }),/restart-failed/);
        assert.equal(restarted,2);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});
test('manual recover restores old release when SSH exited between renames',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        fs.mkdirSync(path.dirname(previous),{recursive:true});
        fs.renameSync(live,previous);
        const result=await recoverLanding(home,fresh,old,{
            restart:async()=>{},
            verify:async(s)=>assert.equal(s,old),
        });
        assert.equal(result.status,'RECOVERED');
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
        assert.equal(fs.existsSync(previous),false);
    });
});
test('manual recover restores old release if new was already installed',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        fs.mkdirSync(path.dirname(previous),{recursive:true});
        fs.renameSync(live,previous);
        fs.renameSync(stage,live);
        const result=await recoverLanding(home,fresh,old,{
            restart:async()=>{},
            verify:async(s)=>assert.equal(s,old),
        });
        assert.equal(result.status,'RECOVERED');
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
        assert.equal(fs.existsSync(previous),false);
    });
});
test('fails closed when domain symlink points outside expected live app',async()=>{
    await fixture(async ({home,live,stage,linkDir})=>{
        fs.unlinkSync(path.join(linkDir,'public_nodejs'));
        fs.symlinkSync(path.dirname(live),path.join(linkDir,'public_nodejs'));
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},verify:async()=>{},
        }),/domain-link-mismatch/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});
test('rejects stale staged SHA and leaves live runtime untouched',async()=>{
    await fixture(async ({home,live,stage})=>{
        const receipt=path.join(stage,'public/__release.json');
        const bad=JSON.parse(fs.readFileSync(receipt,'utf8'));
        bad.sha='c'.repeat(40);
        fs.writeFileSync(receipt,JSON.stringify(bad));
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},verify:async()=>{},
        }),/release-metadata-mismatch/);
        assert.equal(release(live),old);
    });
});
test('does not overwrite an existing prior release',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        fs.mkdirSync(previous,{recursive:true});
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},verify:async()=>{},
        }),/previous-release-exists/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});
test('plan mode is read-only and does not require activation approval',async()=>{
    await fixture(({home,live,stage})=>{
        const p=spawnSync(process.execPath,[script,fresh,old,'--plan'],{
            env:{...process.env,HOME:home},encoding:'utf8',timeout:10000,
        });
        assert.equal(p.status,0,p.stderr);
        assert.match(p.stdout,/DEV_LANDING_ACTIVATION_PLAN=PASS/);
        assert.match(p.stdout,/ACTIVATION=NOT_STARTED/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});
test('execute mode needs operator-provided exact approval SHA',async()=>{
    await fixture(({home,live,stage})=>{
        const p=spawnSync(process.execPath,[script,fresh,old,'--execute'],{
            env:{...process.env,HOME:home,SALONBW_DEV_LANDING_APPROVED_SHA:''},
            encoding:'utf8',timeout:10000,
        });
        assert.notEqual(p.status,0);
        assert.match(p.stderr,/unapproved-activation/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});

test('live HTTP verifier classifies upstream 503 without exposing secrets or response body',async()=>{
    await fixture(async ({stage})=>{
        const diagnostics=[];
        await assert.rejects(remoteVerify(fresh,stage,{
            request:async()=>new Response('SENSITIVE_RESPONSE_BODY',{status:503}),
            maxAttempts:2,
            sleep:async()=>{},
            diagnostic:line=>diagnostics.push(line),
        }),/live-http-verification-failed/);
        assert.equal(diagnostics.length,2);
        assert.match(diagnostics[0],
            /phase=RELEASE_HTTP category=HTTP_STATUS http_status=503 attempts=2/);
        assert.match(diagnostics[1],
            /RELEASE_HTTP:HTTP_STATUS:503=2/);
        assert.ok(diagnostics.every(s=>
            !s.includes('TEST_SECRET_NOT_FOR_OUTPUT') &&
            !s.includes('SENSITIVE_RESPONSE_BODY') &&
            !s.includes('Basic ')));
    });
});

test('live HTTP verifier reports mismatch and does not mistake old release for fresh',async()=>{
    await fixture(async ({stage})=>{
        const diagnostics=[];
        let requests=0;
        await assert.rejects(remoteVerify(fresh,stage,{
            request:async()=>{
                requests++;
                return new Response(JSON.stringify({
                    sha:old,buildId:'SyntheticBuild12345',
                    environment:'development',
                    api:'https://dev-api.salon-bw.pl',
                }),{status:200});
            },
            maxAttempts:1,
            sleep:async()=>{},
            diagnostic:line=>diagnostics.push(line),
        }),/live-http-verification-failed/);
        assert.equal(requests,1);
        assert.match(diagnostics[0],
            /phase=RELEASE_METADATA category=RELEASE_MISMATCH http_status=200/);
    });
});

test('live HTTP verifier passes matching release and home page build without diagnostics',async()=>{
    await fixture(async ({stage})=>{
        const diagnostics=[];
        let requests=0;
        await remoteVerify(fresh,stage,{
            request:async url=>{
                requests++;
                if(url.includes('__release.json'))return new Response(JSON.stringify({
                    sha:fresh,buildId:'SyntheticBuild12345',
                    environment:'development',
                    api:'https://dev-api.salon-bw.pl',
                }),{status:200});
                if(new URL(url).pathname==='/')return new Response(
                    '<html>SyntheticBuild12345</html>',{status:200});
                throw Error('unexpected route');
            },
            maxAttempts:1,
            sleep:async()=>{},
            diagnostic:line=>diagnostics.push(line),
        });
        assert.equal(requests,2);
        assert.deepEqual(diagnostics,[]);
    });
});

test('activation plan refuses a 0700 stage before any live move',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        fs.chmodSync(stage,0o700);
        fs.chmodSync(path.join(stage,'public'),0o700);
        fs.chmodSync(path.join(stage,'public/__release.json'),0o600);
        const result=spawnSync(process.execPath,[script,fresh,old,'--plan'],{
            env:{...process.env,HOME:home},encoding:'utf8',timeout:10000,
        });
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/staged-runtime-not-web-readable/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
        assert.equal(fs.existsSync(previous),false);
    });
});

test('activation plan accepts web-readable release while keeping config private',async()=>{
    await fixture(async ({home,stage})=>{
        const file=path.join(stage,'.env.runtime.json');
        assert.equal(fs.statSync(file).mode&0o777,0o600);
        const result=spawnSync(process.execPath,[script,fresh,old,'--plan'],{
            env:{...process.env,HOME:home},encoding:'utf8',timeout:10000,
        });
        assert.equal(result.status,0,result.stderr);
        assert.match(result.stdout,/DEV_LANDING_ACTIVATION_PLAN=PASS/);
        assert.equal(fs.statSync(file).mode&0o777,0o600);
    });
});

// Landing-specific: the release live before this channel has no
// public/__release.json (legacy GitHub-workflow build).
function makeLegacy(dir){
    fs.rmSync(path.join(dir,'public/__release.json'));
}
const appRelease=(p)=>JSON.parse(fs.readFileSync(path.join(p,'.env.runtime.json'),'utf8')).APP_RELEASE;
test('legacy live release without __release.json is accepted as previous and preserved',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        makeLegacy(live);
        const p=spawnSync(process.execPath,[script,fresh,old,'--plan'],{
            env:{...process.env,HOME:home},encoding:'utf8',timeout:10000,
        });
        assert.equal(p.status,0,p.stderr);
        const result=await activateLanding(home,fresh,old,{
            restart:async()=>{},verify:async(s)=>assert.equal(s,fresh),
        });
        assert.equal(result.status,'PASS');
        assert.equal(release(live),fresh);
        assert.equal(appRelease(previous),old);
        assert.equal(fs.existsSync(path.join(previous,'public/__release.json')),false);
        assert.equal(fs.existsSync(stage),false);
    });
});
test('failed smoke rolls back to a legacy release and re-verifies it',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        makeLegacy(live);
        const verified=[];
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},
            verify:async(s)=>{verified.push(s);if(s===fresh)throw new Error('live-http-verification-failed');},
        }),/live-http-verification-failed/);
        assert.deepEqual(verified,[fresh,old]);
        assert.equal(appRelease(live),old);
        assert.equal(release(stage),fresh);
        assert.equal(fs.existsSync(previous),false);
    });
});
test('a staged candidate without __release.json is refused',async()=>{
    await fixture(async ({home,live,stage})=>{
        makeLegacy(stage);
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},verify:async()=>{},
        }),/runtime-not-verified/);
        assert.equal(appRelease(live),old);
        assert.equal(fs.existsSync(stage),true);
    });
});
test('legacy live with mismatching APP_RELEASE is refused before any move',async()=>{
    await fixture(async ({home,live})=>{
        makeLegacy(live);
        await assert.rejects(activateLanding(home,fresh,'c'.repeat(40),{
            restart:async()=>{},verify:async()=>{},
        }),/runtime-config-mismatch/);
        assert.equal(appRelease(live),old);
    });
});
test('legacy verifier checks home page build id only',async()=>{
    await fixture(async ({live})=>{
        makeLegacy(live);
        const urls=[];
        await remoteVerify(old,live,{
            request:async url=>{urls.push(new URL(url).pathname);
                return new Response('<html>SyntheticBuild12345</html>',{status:200});},
            maxAttempts:1,sleep:async()=>{},diagnostic:()=>{},
        });
        assert.deepEqual(urls,['/']);
        const diagnostics=[];
        await assert.rejects(remoteVerify(old,live,{
            request:async()=>new Response('<html>OtherBuild999999</html>',{status:200}),
            maxAttempts:1,sleep:async()=>{},diagnostic:l=>diagnostics.push(l),
        }),/live-http-verification-failed/);
        assert.match(diagnostics[0],/phase=HOME_HTML category=HOME_BUILD_MISMATCH/);
    });
});

test('activation plan refuses a stage with leftover standalone runtime links',async()=>{
    await fixture(async ({home,live,stage})=>{
        const dir=path.join(stage,'.next/standalone/node_modules');
        fs.mkdirSync(dir,{recursive:true});
        fs.symlinkSync(path.join(stage,'node_modules/next'),path.join(dir,'sharp'));
        const p=spawnSync(process.execPath,[script,fresh,old,'--plan'],{
            env:{...process.env,HOME:home},encoding:'utf8',timeout:10000,
        });
        assert.notEqual(p.status,0);
        assert.match(p.stderr,/staged-runtime-links-present/);
        assert.equal(release(live),old);
    });
});

test('successful activation keeps only the replaced release and prunes older copies',async()=>{
    await fixture(async ({home,root,live,previous})=>{
        const older=path.join(root,'previous-landing','c'.repeat(40)+'-before-'+old);
        const stranger=path.join(root,'previous-landing','keep-me');
        fs.mkdirSync(older,{recursive:true});
        fs.mkdirSync(stranger,{recursive:true});
        const incoming=path.join(root,'incoming');
        fs.mkdirSync(incoming,{recursive:true});
        for(const sha of [fresh,old,'c'.repeat(40)]) {
            fs.writeFileSync(path.join(incoming,'landing-dev-'+sha+'.tar.gz'),'x');
        }
        fs.writeFileSync(path.join(incoming,'panel-dev-'+'c'.repeat(40)+'.tar.gz'),'x');
        const result=await activateLanding(home,fresh,old,{restart:async()=>{},verify:async()=>{}});
        assert.equal(result.status,'PASS');
        assert.deepEqual(result.pruned,{previous:1,archives:1});
        assert.equal(release(live),fresh);
        assert.equal(release(previous),old);
        assert.equal(fs.existsSync(older),false);
        assert.equal(fs.existsSync(stranger),true);
        assert.deepEqual(fs.readdirSync(incoming).sort(),[
            'landing-dev-'+old+'.tar.gz','landing-dev-'+fresh+'.tar.gz',
            'panel-dev-'+'c'.repeat(40)+'.tar.gz',
        ].sort());
    });
});
test('failed activation never prunes older releases',async()=>{
    await fixture(async ({home,root,live})=>{
        const older=path.join(root,'previous-landing','c'.repeat(40)+'-before-'+old);
        fs.mkdirSync(older,{recursive:true});
        await assert.rejects(activateLanding(home,fresh,old,{
            restart:async()=>{},
            verify:async(s)=>{if(s===fresh)throw new Error('live-http-verification-failed');},
        }),/live-http-verification-failed/);
        assert.equal(release(live),old);
        assert.equal(fs.existsSync(older),true);
    });
});
