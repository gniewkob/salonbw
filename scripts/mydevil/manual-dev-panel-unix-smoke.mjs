#!/usr/bin/env node
// Exercise a staged DEV panel over a private AF_UNIX socket, analogous to
// Passenger's reverse port binding. No live app edits or Passenger restart.
// Does not by itself prove actual Passenger hosting or backend compatibility.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ALLOWED = new Set([
  'invalid-input','unsafe-root','domain-mismatch','staged-files-missing',
  'invalid-private-config','staged-release-mismatch','unix-socket-path-too-long',
  'child-exited','startup-timeout','bad-release-response','bad-login-response',
  'bad-login-build','bad-v18-auth-redirect','http-body-limit','http-error',
]);
const safeError = e => ALLOWED.has(e?.message) ? e.message : 'unexpected-stage-error';
const st = p => { try { return fs.lstatSync(p); } catch(e) {
  if (e.code === 'ENOENT') return null;
  throw e;
} };
const realDir = p => st(p)?.isDirectory() && !st(p)?.isSymbolicLink();
const regularFile = p => st(p)?.isFile() && !st(p)?.isSymbolicLink();
const assert = (v,reason) => { if (!v) throw Error(reason); };

// Only the first http.Server.listen() is redirected. The port arguments
// are deliberately discarded. This remains IN THE CHILD PROCESS ONLY.
const BOOT = [
  "'use strict';",
  "const http=require('node:http');",
  "const fs=require('node:fs');",
  "const socket=process.env.SALONBW_SMOKE_UNIX_SOCKET;",
  "const app=process.env.SALONBW_SMOKE_ENTRYPOINT;",
  "if (!socket || !app || socket.length>103 || !socket.startsWith('/tmp/sbw-v18-') || !fs.statSync(app).isFile()) process.exit(2);",
  "const orig=http.Server.prototype.listen;",
  "let count=0;",
  "http.Server.prototype.listen=function(...args) {",
  "  if (++count!==1) throw Error('Multiple HTTP listeners in staged runtime');",
  "  return orig.call(this,socket);",
  "};",
  "require(app);",
].join('\n');

function requestSocket(socketPath,route,authorization) {
  return new Promise((resolve,reject)=>{
    let size=0,parts=[];
    const req=http.request({
      socketPath,path:route,method:'GET',
      headers:{
        Host:'dev-panel.salon-bw.pl',
        Authorization:authorization,
        'Cache-Control':'no-store',
      },
    },res=>{
      res.on('data',chunk=>{
        size+=chunk.length;
        if (size>4*1024*1024) {
          req.destroy(Error('http-body-limit'));
          return;
        }
        parts.push(chunk);
      });
      res.once('end',()=>resolve({
        status:res.statusCode,
        location:res.headers.location||'',
        body:Buffer.concat(parts).toString('utf8'),
      }));
      res.once('error',()=>reject(Error('http-error')));
    });
    req.once('error',()=>reject(Error('http-error')));
    req.setTimeout(6000,()=>req.destroy(Error('http-error')));
    req.end();
  });
}
const limitCapture = (old,chunk) => (old+chunk.toString('utf8')).slice(-32768);

export async function stagedUnixSmoke(home,sha,{timeoutMs=30000}={}) {
  assert(path.isAbsolute(home||'') && /^[a-f0-9]{40}$/.test(sha||''),
    'invalid-input');
  const base=path.join(home,'.salonbw-manual');
  const stage=path.join(base,'staged-panel',sha);
  const live=path.join(home,'apps/nodejs/panelbw_dev');
  const domain=path.join(home,'domains/dev-panel.salon-bw.pl/public_nodejs');
  assert(realDir(base)&&realDir(stage)&&realDir(live),'unsafe-root');
  assert(st(domain)?.isSymbolicLink() &&
    fs.realpathSync(domain)===fs.realpathSync(live),'domain-mismatch');

  const entry=path.join(stage,'app.cjs');
  const configPath=path.join(stage,'.env.runtime.json');
  const releasePath=path.join(stage,'public/__release.json');
  const buildPath=path.join(stage,'.next/BUILD_ID');
  assert([
    entry,configPath,releasePath,buildPath,
    path.join(stage,'.next/server/font-manifest.json'),
    path.join(stage,'scripts/staged-listen-host.cjs'),
    path.join(stage,'node_modules/next/package.json'),
  ].every(regularFile),'staged-files-missing');
  assert(st(configPath).size>0 && st(configPath).size<=16384 &&
    (st(configPath).mode&0o077)===0,'invalid-private-config');
  const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
  const release=JSON.parse(fs.readFileSync(releasePath,'utf8'));
  const build=fs.readFileSync(buildPath,'utf8').trim();
  assert(config.APP_ENV==='development' &&
    config.NEXT_PUBLIC_DEPLOYMENT_ENV==='development' &&
    config.NEXT_PUBLIC_AUTH_COOKIE_PREFIX==='dev_' &&
    config.API_PROXY_URL==='https://dev-api.salon-bw.pl' &&
    config.APP_RELEASE===sha &&
    typeof config.DEV_ACCESS_USER==='string' && config.DEV_ACCESS_USER &&
    typeof config.DEV_ACCESS_PASSWORD==='string' && config.DEV_ACCESS_PASSWORD,
  'invalid-private-config');
  assert(release.sha===sha &&
    release.environment==='development' &&
    release.api==='https://dev-api.salon-bw.pl' &&
    release.buildId===build,'staged-release-mismatch');

  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sbw-v18-'));
  fs.chmodSync(temp,0o700);
  const socketPath=path.join(temp,'s');
  let child=null;
  let closed=false;
  let exited=false;
  let childOutput='';
  try {
    assert(socketPath.startsWith('/tmp/sbw-v18-') &&
      Buffer.byteLength(socketPath)<100,'unix-socket-path-too-long');
    const env={...process.env,
      NODE_ENV:'production',
      HOSTNAME:'127.0.0.1',
      NEXT_PUBLIC_DEPLOYMENT_ENV:'development',
      SALONBW_SMOKE_UNIX_SOCKET:socketPath,
      SALONBW_SMOKE_ENTRYPOINT:entry,
    };
    for(const k of ['PORT','PASSENGER_PORT','APP_PORT','SALONBW_STAGE_LOOPBACK_HOST']) {
      delete env[k];
    }
    child=spawn(process.execPath,['-e',BOOT],{
      cwd:stage,env,detached:true,stdio:['ignore','ignore','pipe'],
    });
    child.stderr.on('data',chunk=>{
      childOutput=limitCapture(childOutput,chunk);
    });
    child.once('error',()=>{exited=true;});
    child.once('exit',()=>{exited=true;});
    child.once('close',()=>{closed=true;});

    const basic='Basic '+Buffer.from(
      config.DEV_ACCESS_USER+':'+config.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    let receipt=null;
    const start=Date.now();
    while(Date.now()-start<timeoutMs){
      if(exited)throw Error('child-exited');
      if(st(socketPath)?.isSocket()){
        try {
          receipt=await requestSocket(socketPath,'/__release.json',basic);
          if(receipt.status!==200)throw Error('bad-release-response');
          break;
        } catch(e) {
          if(e.message==='bad-release-response'||e.message==='http-body-limit')throw e;
        }
      }
      await new Promise(resolve=>setTimeout(resolve,350));
    }
    assert(receipt,'startup-timeout');
    let remoteRelease;
    try { remoteRelease=JSON.parse(receipt.body); }
    catch { throw Error('bad-release-response'); }
    assert(remoteRelease.sha===sha && remoteRelease.buildId===build,
      'bad-release-response');

    const login=await requestSocket(socketPath,'/auth/login',basic);
    assert(login.status===200,'bad-login-response');
    assert(login.body.includes(build),'bad-login-build');
    const v18=await requestSocket(socketPath,'/studio-v18',basic);
    let pointsToLogin=false;
    if([301,302,303,307,308].includes(v18.status)){
      try{pointsToLogin=new URL(v18.location,'http://dev-panel.salon-bw.pl')
        .pathname==='/auth/login';}
      catch{}
    }
    assert(pointsToLogin,'bad-v18-auth-redirect');
    return {sha,passed:true};
  } catch(e) {
    // Never emit raw child output, stack traces, passwords or paths.
    if(e.message==='child-exited') {
      const reason=/(?:EACCES|EPERM)/i.test(childOutput)
        ? 'PERMISSION_DENIED' :
        /Cannot find module|MODULE_NOT_FOUND/i.test(childOutput)
          ? 'MISSING_MODULE' : 'OTHER';
      console.error('STAGED_UNIX_CHILD_FAILURE_CLASS='+reason);
    }
    throw e;
  } finally {
    if(child?.pid){
      try {process.kill(-child.pid,'SIGTERM');} catch {}
      if(!closed) {
        await Promise.race([
          new Promise(resolve=>child.once('close',resolve)),
          new Promise(resolve=>setTimeout(resolve,1500)),
        ]);
      }
      // Terminate any lingering Next child processes in the same group.
      try {process.kill(-child.pid,'SIGKILL');} catch {}
    }
    fs.rmSync(temp,{recursive:true,force:true});
  }
}

if(process.argv[1]==='-' ||
  (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)){
  try{
    if(process.argv.length!==3)throw Error('invalid-input');
    const result=await stagedUnixSmoke(process.env.HOME,process.argv[2]);
    console.log('DEV_PANEL_UNIX_SMOKE=PASS sha='+result.sha);
    console.log('PRIVATE_UNIX_HTTP=PASS');
    console.log('STAGED_LOGIN=PASS');
    console.log('STAGED_V18_AUTH_BOUNDARY=PASS');
    console.log('LIVE_RUNTIME_MUTATIONS=NONE');
    console.log('PASSENGER_RESTART=NOT_STARTED');
    console.log('ACTIVATION=NOT_STARTED');
  }catch(e){
    console.error('DEV_PANEL_UNIX_SMOKE=BLOCKED reason='+safeError(e));
    process.exitCode=1;
  }
}
