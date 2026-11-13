#!/usr/bin/env node
// Investigate MyDevil TCP bind restrictions without modifying apps.
// All listeners are empty, bound briefly, then closed. No secrets logged.
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function bindOnce(port, host) {
  const server=net.createServer();
  try {
    await new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.listen(port,host,resolve);
    });
    return {status:'PASS',port:server.address().port};
  } catch(e) {
    return {status:({
      EACCES:'PERMISSION_DENIED',
      EPERM:'PERMISSION_DENIED',
      EADDRINUSE:'IN_USE',
      EADDRNOTAVAIL:'UNAVAILABLE_ADDRESS',
      EAFNOSUPPORT:'UNAVAILABLE_ADDRESS',
    })[e.code] || 'UNAVAILABLE',port:null};
  } finally {
    if(server.listening) await new Promise(resolve=>server.close(resolve));
  }
}

export async function compareBinds() {
  const ip4='127.0.0.1';
  const wildcard='0.0.0.0';
  const autoLoopback=await bindOnce(0,ip4);
  const explicitLoopback=autoLoopback.status==='PASS'
    ? await bindOnce(autoLoopback.port,ip4) : {status:'SKIPPED'};
  const explicitWildcard=autoLoopback.status==='PASS'
    ? await bindOnce(autoLoopback.port,wildcard) : {status:'SKIPPED'};
  const autoWildcard=await bindOnce(0,wildcard);
  return {
    autoLoopback:autoLoopback.status,
    explicitLoopback:explicitLoopback.status,
    explicitWildcard:explicitWildcard.status,
    autoWildcard:autoWildcard.status,
  };
}

function guardStage(home,sha) {
  if(!path.isAbsolute(home||'')||!/^[a-f0-9]{40}$/.test(sha||'')) {
    throw Error('INVALID_INPUT');
  }
  const stage=path.join(home,'.salonbw-manual/staged-panel',sha);
  const live=path.join(home,'apps/nodejs/panelbw_dev');
  const domain=path.join(home,'domains/dev-panel.salon-bw.pl/public_nodejs');
  const app=path.join(stage,'app.cjs');
  const config=path.join(stage,'.env.runtime.json');
  const release=path.join(stage,'public/__release.json');
  const isDir=p=>{const st=fs.lstatSync(p);return st.isDirectory()&&!st.isSymbolicLink();};
  const isFile=p=>{const st=fs.lstatSync(p);return st.isFile()&&!st.isSymbolicLink();};
  if(!isDir(stage)||!isDir(live)||!fs.lstatSync(domain).isSymbolicLink()||
    fs.realpathSync(domain)!==fs.realpathSync(live)||
    !isFile(app)||!isFile(config)||!isFile(release)) {
    throw Error('INVALID_STAGING_TOPOLOGY');
  }
  const cfg=JSON.parse(fs.readFileSync(config,'utf8'));
  const rel=JSON.parse(fs.readFileSync(release,'utf8'));
  if(cfg.APP_ENV!=='development'||cfg.APP_RELEASE!==sha||
    rel.sha!==sha||cfg.NEXT_PUBLIC_DEPLOYMENT_ENV!=='development'){
    throw Error('INVALID_STAGE_SHA');
  }
  return {hasHostGuard:fs.readFileSync(app,'utf8').includes('listenWithStagingGuard')};
}

if(process.argv[1]==='-'||
  (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)) {
  try {
    if(process.argv.length!==3)throw Error('INVALID_INPUT');
    const guard=guardStage(process.env.HOME,process.argv[2]);
    const result=await compareBinds();
    console.log('STAGED_HOST_GUARD='+ (guard.hasHostGuard?'PRESENT':'MISSING'));
    console.log('TCP_BIND_AUTO_LOOPBACK='+result.autoLoopback);
    console.log('TCP_BIND_EXPLICIT_LOOPBACK='+result.explicitLoopback);
    console.log('TCP_BIND_EXPLICIT_WILDCARD='+result.explicitWildcard);
    console.log('TCP_BIND_AUTO_WILDCARD='+result.autoWildcard);
    console.log('DEV_PANEL_PORT_PROBE=PASS');
    console.log('LIVE_RUNTIME_MUTATIONS=NONE');
    console.log('PASSENGER_RESTART=NOT_STARTED');
    console.log('ACTIVATION=NOT_STARTED');
  } catch(e) {
    const known=new Set(['INVALID_INPUT','INVALID_STAGING_TOPOLOGY','INVALID_STAGE_SHA']);
    console.error('DEV_PANEL_PORT_PROBE=BLOCKED reason='+
      (known.has(e?.message)?e.message:'UNCLASSIFIED'));
    process.exitCode=1;
  }
}
