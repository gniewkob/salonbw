import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stagedUnixSmoke } from '../mydevil/manual-dev-panel-unix-smoke.mjs';

const SHA='a'.repeat(40);
const SECRET='PRIVATE_STAGED_TEST_SECRET_NOT_FOR_LOGS';
const script=fileURLToPath(new URL('../mydevil/manual-dev-panel-unix-smoke.mjs',import.meta.url));

async function fixture(run,{broken=false}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sbw-unix-fixture-'));
  const home=path.join(root,'home');
  const stage=path.join(home,'.salonbw-manual/staged-panel',SHA);
  const live=path.join(home,'apps/nodejs/panelbw_dev');
  const domain=path.join(home,'domains/dev-panel.salon-bw.pl');
  const data={
    sha:SHA,buildId:'SyntheticBuild9876',
    environment:'development',api:'https://dev-api.salon-bw.pl',
  };
  fs.mkdirSync(path.join(stage,'.next/server'),{recursive:true});
  fs.mkdirSync(path.join(stage,'public'),{recursive:true});
  fs.mkdirSync(path.join(stage,'scripts'),{recursive:true});
  fs.mkdirSync(path.join(stage,'node_modules/next'),{recursive:true});
  fs.mkdirSync(live,{recursive:true});
  fs.mkdirSync(domain,{recursive:true});
  fs.symlinkSync(live,path.join(domain,'public_nodejs'));
  fs.writeFileSync(path.join(stage,'.next/BUILD_ID'),data.buildId);
  fs.writeFileSync(path.join(stage,'.next/server/font-manifest.json'),'[]');
  fs.writeFileSync(path.join(stage,'scripts/staged-listen-host.cjs'),'module.exports={};');
  fs.writeFileSync(path.join(stage,'node_modules/next/package.json'),'{}');
  fs.writeFileSync(path.join(stage,'public/__release.json'),JSON.stringify(data));
  const config=path.join(stage,'.env.runtime.json');
  fs.writeFileSync(config,JSON.stringify({
    APP_ENV:'development',APP_RELEASE:SHA,
    NEXT_PUBLIC_DEPLOYMENT_ENV:'development',
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX:'dev_',
    API_PROXY_URL:'https://dev-api.salon-bw.pl',
    DEV_ACCESS_USER:'smoke',DEV_ACCESS_PASSWORD:SECRET,
  }),{mode:0o600});
  const app=[
    "const http=require('node:http'),fs=require('node:fs'),path=require('node:path');",
    "if(process.env.SALONBW_STAGE_LOOPBACK_HOST)throw Error('Unexpected TCP override');",
    "const config=JSON.parse(fs.readFileSync(path.join(__dirname,'.env.runtime.json'),'utf8'));",
    "const release=JSON.parse(fs.readFileSync(path.join(__dirname,'public/__release.json'),'utf8'));",
    "const auth='Basic '+Buffer.from(config.DEV_ACCESS_USER+':'+config.DEV_ACCESS_PASSWORD).toString('base64');",
    "http.createServer((req,res)=>{",
    "if(req.headers.authorization!==auth){res.writeHead(401);res.end();return;}",
    "if(req.url==='/__release.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(release));return;}",
    "if(req.url==='/auth/login'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<html>'+release.buildId+'</html>');return;}",
    "if(req.url==='/studio-v18'){res.writeHead(307,{Location:'/auth/login?next=%2Fstudio-v18'});res.end();return;}",
    "res.writeHead(404);res.end();",
    "}).listen(38383);",
  ].join('\n');
  fs.writeFileSync(path.join(stage,'app.cjs'),broken
    ? "console.error(" + JSON.stringify('CRASH_WITH_PRIVATE_OUTPUT_'+SECRET) + ");process.exit(1);" : app);
  try{return await run({home,stage,live,domain,config});}
  finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('starts and checks staged HTTP over private Unix socket with no TCP bind',async()=>{
  await fixture(async ({home,stage})=>{
    const before=fs.readdirSync(stage).sort();
    const result=await stagedUnixSmoke(home,SHA,{timeoutMs:7500});
    assert.equal(result.passed,true);
    assert.equal(result.sha,SHA);
    assert.deepEqual(fs.readdirSync(stage).sort(),before);
  });
});
test('staged Unix smoke refuses an unexpected domain symlink',async()=>{
  await fixture(async ({home,live,domain})=>{
    const link=path.join(domain,'public_nodejs');
    fs.unlinkSync(link);
    fs.symlinkSync(path.dirname(live),link);
    await assert.rejects(stagedUnixSmoke(home,SHA),/domain-mismatch/);
  });
});
test('staged Unix smoke rejects weak private configuration permissions',async()=>{
  await fixture(async ({home,config})=>{
    fs.chmodSync(config,0o644);
    await assert.rejects(stagedUnixSmoke(home,SHA),/invalid-private-config/);
  });
});
test('staged Unix smoke rejects wrong release SHA without executing app',async()=>{
  await fixture(async ({home,stage})=>{
    const pathRelease=path.join(stage,'public/__release.json');
    const rel=JSON.parse(fs.readFileSync(pathRelease,'utf8'));
    rel.sha='b'.repeat(40);
    fs.writeFileSync(pathRelease,JSON.stringify(rel));
    await assert.rejects(stagedUnixSmoke(home,SHA),/staged-release-mismatch/);
  });
});
test('synthetic child error never exposes private values or raw child stderr',async()=>{
  await fixture(async ({home})=>{
    const result=spawnSync(process.execPath,[script,SHA],{
      encoding:'utf8',timeout:15000,
      env:{...process.env,HOME:home},
    });
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/DEV_PANEL_UNIX_SMOKE=BLOCKED reason=child-exited/);
    assert.match(result.stderr,/STAGED_UNIX_CHILD_FAILURE_CLASS=OTHER/);
    assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE_STAGED_TEST_SECRET_NOT_FOR_LOGS/);
    assert.doesNotMatch(result.stdout+result.stderr,/CRASH_WITH_PRIVATE_OUTPUT_/);
  },{broken:true});
});
