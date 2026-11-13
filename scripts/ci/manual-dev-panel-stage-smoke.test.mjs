import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../mydevil/manual-dev-panel-stage-smoke.mjs', import.meta.url));
const sha = 'a'.repeat(40);
const old = 'b'.repeat(40);
const build = 'SyntheticV18Build123';
const secret = 'PRIVATE_TEST_SECRET_NOT_FOR_OUTPUT';
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'salonbw-stage-smoke-test-'));
  const home = path.join(root, 'home');
  const stage = path.join(home, '.salonbw-manual/staged-panel', sha);
  const live = path.join(home, 'apps/nodejs/panelbw_dev');
  const domains = path.join(home, 'domains/dev-panel.salon-bw.pl');
  fs.mkdirSync(path.join(stage, 'node_modules/next'), {recursive:true});
  fs.mkdirSync(path.join(stage, '.next'), {recursive:true});
  fs.mkdirSync(path.join(stage, 'public'), {recursive:true});
  fs.mkdirSync(live, {recursive:true});
  fs.mkdirSync(domains, {recursive:true});
  fs.symlinkSync(live, path.join(domains, 'public_nodejs'));
  const config = path.join(stage, '.env.runtime.json');
  fs.writeFileSync(config, JSON.stringify({
    APP_ENV: 'development', APP_RELEASE: sha,
    NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX: 'dev_',
    API_PROXY_URL: 'https://dev-api.salon-bw.pl',
    DEV_ACCESS_USER: 'tester', DEV_ACCESS_PASSWORD: secret,
  }), {mode:0o600});
  fs.writeFileSync(path.join(stage,'.next/BUILD_ID'),build);
  fs.writeFileSync(path.join(stage,'node_modules/next/package.json'), '{}');
  fs.writeFileSync(path.join(stage,'public/__release.json'), JSON.stringify({
    sha, buildId:build, environment:'development',
    api:'https://dev-api.salon-bw.pl',
  }));
  const app = [
    "const http=require('http'), fs=require('fs'), path=require('path');",
    "const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'.env.runtime.json'),'utf8'));",
    "const rel=JSON.parse(fs.readFileSync(path.join(__dirname,'public/__release.json'),'utf8'));",
    "const basic='Basic '+Buffer.from(cfg.DEV_ACCESS_USER+':'+cfg.DEV_ACCESS_PASSWORD).toString('base64');",
    "http.createServer((req,res)=>{",
    "if(req.headers.authorization!==basic){res.writeHead(401);res.end();return}",
    "if(req.url==='/__release.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(rel));return}",
    "if(req.url==='/auth/login'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<html>'+rel.buildId+'</html>');return}",
    "if(req.url==='/studio-v18'){res.writeHead(307,{'Location':'/auth/login?redirectTo=%2Fstudio-v18'});res.end();return}",
    "res.writeHead(404);res.end();",
    "}).listen(Number(process.env.PORT),'127.0.0.1')",
  ].join('\n');
  fs.writeFileSync(path.join(stage,'app.cjs'),app);
  try { run({home,stage,live,config,domains}); }
  finally {fs.rmSync(root,{recursive:true,force:true});}
}
function invoke(home,arg=sha){
  return spawnSync(process.execPath,[script,arg],{
    env:{...process.env,HOME:home},encoding:'utf8',timeout:30000,
  });
}
test('isolated staged HTTP smoke validates release, login and auth boundary',()=>{
  fixture(({home})=>{
    const result=invoke(home);
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/DEV_PANEL_STAGE_SMOKE=PASS/);
    assert.match(result.stdout,/STAGED_V18_AUTH_BOUNDARY=PASS/);
    assert.match(result.stdout,/LIVE_RUNTIME_MUTATIONS=NONE/);
    assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE_TEST_SECRET_NOT_FOR_OUTPUT/);
  });
});
test('rejects mismatched stage SHA without leaking runtime config',()=>{
  fixture(({home,config})=>{
    const value=JSON.parse(fs.readFileSync(config,'utf8'));
    value.APP_RELEASE=old;
    fs.writeFileSync(config,JSON.stringify(value),{mode:0o600});
    const result=invoke(home);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/staged-runtime-isolation-mismatch/);
    assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE_TEST_SECRET_NOT_FOR_OUTPUT/);
  });
});
test('rejects symlinked domain target changing before staging smoke',()=>{
  fixture(({home,live,domains})=>{
    const link=path.join(domains,'public_nodejs');
    fs.unlinkSync(link);
    fs.symlinkSync(path.dirname(live),link);
    const result=invoke(home);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/unexpected-live-domain-target/);
  });
});
test('rejects group-readable private runtime config',()=>{
  fixture(({home,config})=>{
    fs.chmodSync(config,0o640);
    const result=invoke(home);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/invalid-private-config-permissions/);
  });
});
