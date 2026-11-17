import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { activatePanel, recoverPanel, remoteVerify } from '../mydevil/manual-dev-panel-activate.mjs';

const script=fileURLToPath(new URL('../mydevil/manual-dev-panel-activate.mjs',import.meta.url));
const old='b'.repeat(40), fresh='a'.repeat(40);
async function fixture(run) {
    const parent=fs.mkdtempSync(path.join(os.tmpdir(),'salonbw-activation-test-'));
    const home=path.join(parent,'home'), root=path.join(home,'.salonbw-manual');
    const live=path.join(home,'apps/nodejs/panelbw_dev');
    const stage=path.join(root,'staged-panel',fresh);
    const previous=path.join(root,'previous-panel',old+'-before-'+fresh);
    const linkDir=path.join(home,'domains/dev-panel.salon-bw.pl');
    fs.mkdirSync(path.join(root,'locks'),{recursive:true});
    fs.mkdirSync(path.join(root,'sources',fresh),{recursive:true});
    fs.mkdirSync(linkDir,{recursive:true});
    fs.writeFileSync(path.join(root,'sources',fresh,'.salonbw-source-sha'),fresh+'\n');
    fs.writeFileSync(path.join(root,'panelbw_dev-predeploy-20261113-192747.tar.gz'),'not a real archive',{mode:0o600});
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
        const result=await activatePanel(home,fresh,old,{
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
        await assert.rejects(activatePanel(home,fresh,old,{
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
        await assert.rejects(activatePanel(home,fresh,old,{
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
        const result=await recoverPanel(home,fresh,old,{
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
        const result=await recoverPanel(home,fresh,old,{
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
        await assert.rejects(activatePanel(home,fresh,old,{
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
        await assert.rejects(activatePanel(home,fresh,old,{
            restart:async()=>{},verify:async()=>{},
        }),/release-metadata-mismatch/);
        assert.equal(release(live),old);
    });
});
test('does not overwrite an existing prior release',async()=>{
    await fixture(async ({home,live,stage,previous})=>{
        fs.mkdirSync(previous,{recursive:true});
        await assert.rejects(activatePanel(home,fresh,old,{
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
        assert.match(p.stdout,/DEV_PANEL_ACTIVATION_PLAN=PASS/);
        assert.match(p.stdout,/ACTIVATION=NOT_STARTED/);
        assert.equal(release(live),old);
        assert.equal(release(stage),fresh);
    });
});
test('execute mode needs operator-provided exact approval SHA',async()=>{
    await fixture(({home,live,stage})=>{
        const p=spawnSync(process.execPath,[script,fresh,old,'--execute'],{
            env:{...process.env,HOME:home,SALONBW_DEV_PANEL_APPROVED_SHA:''},
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

test('live HTTP verifier passes matching release and login build without diagnostics',async()=>{
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
                if(url.endsWith('/auth/login'))return new Response(
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
        assert.match(result.stdout,/DEV_PANEL_ACTIVATION_PLAN=PASS/);
        assert.equal(fs.statSync(file).mode&0o777,0o600);
    });
});
