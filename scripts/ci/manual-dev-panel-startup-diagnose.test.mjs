import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyStartupOutput } from '../mydevil/manual-dev-panel-startup-diagnose.mjs';

const script=fileURLToPath(new URL('../mydevil/manual-dev-panel-startup-diagnose.mjs',import.meta.url));
const SHA='a'.repeat(40);
const SECRET='PRIVATE_DIAGNOSTIC_TEST_SECRET_DONT_PRINT';

test('classifies a known missing runtime module with only fixed labels',()=>{
  const result=classifyStartupOutput("Error: Cannot find module 'styled-jsx'\n" + SECRET,1,null);
  assert.deepEqual(result,{
    category:'MISSING_MODULE',module:'STYLED_JSX',
    exitCode:'1',signal:'NONE_OR_UNKNOWN',
  });
  assert.doesNotMatch(JSON.stringify(result),/PRIVATE_DIAGNOSTIC/);
});
test('unknown missing file path is never emitted in diagnosis',()=>{
  const result=classifyStartupOutput("Cannot find module '/home/private/customer/secret'",1,null);
  assert.equal(result.category,'MISSING_MODULE');
  assert.equal(result.module,'OTHER_OR_UNRECOGNIZED');
  assert.doesNotMatch(JSON.stringify(result),/private|customer|secret/);
});
test('classifies native module loading, bad bind, memory and JavaScript startup',()=>{
  assert.equal(classifyStartupOutput('ERR_DLOPEN_FAILED',1,null).category,'NATIVE_MODULE_LOAD_FAILURE');
  assert.equal(classifyStartupOutput('listen EADDRINUSE',1,null).category,'PORT_BIND_FAILURE');
  assert.equal(classifyStartupOutput('heap out of memory',137,'SIGKILL').category,'MEMORY_FAILURE');
  assert.equal(classifyStartupOutput('TypeError: something',1,null).category,'JAVASCRIPT_STARTUP_ERROR');
  assert.equal(classifyStartupOutput('sensitive unrecognized error',99,null).category,'UNCLASSIFIED_EXIT');
});
test('isolated staged-process crash is reported without exposing private stderr',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'salonbw-stage-diag-'));
  try {
    const home=path.join(root,'home');
    const stage=path.join(home,'.salonbw-manual/staged-panel',SHA);
    const live=path.join(home,'apps/nodejs/panelbw_dev');
    const domainDir=path.join(home,'domains/dev-panel.salon-bw.pl');
    fs.mkdirSync(path.join(stage,'public'),{recursive:true});
    fs.mkdirSync(live,{recursive:true});
    fs.mkdirSync(domainDir,{recursive:true});
    fs.symlinkSync(live,path.join(domainDir,'public_nodejs'));
    fs.writeFileSync(path.join(stage,'app.cjs'),
      "console.error(" + JSON.stringify("Error: Cannot find module 'styled-jsx'\n"+SECRET) + ");process.exit(1);");
    fs.writeFileSync(path.join(stage,'.env.runtime.json'),JSON.stringify({
      APP_RELEASE:SHA,APP_ENV:'development',
      API_PROXY_URL:'https://dev-api.salon-bw.pl',
      NEXT_PUBLIC_AUTH_COOKIE_PREFIX:'dev_',
    }),{mode:0o600});
    fs.writeFileSync(path.join(stage,'public/__release.json'),JSON.stringify({sha:SHA}));
    const result=spawnSync(process.execPath,[script,SHA],{
      env:{...process.env,HOME:home},encoding:'utf8',timeout:12000,
    });
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/STAGED_PROCESS_EARLY_EXIT=YES/);
    assert.match(result.stdout,/STAGED_PROCESS_EXIT_CLASS=MISSING_MODULE/);
    assert.match(result.stdout,/STAGED_PROCESS_MISSING_MODULE=STYLED_JSX/);
    assert.match(result.stdout,/LIVE_RUNTIME_MUTATIONS=NONE/);
    assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE_DIAGNOSTIC_TEST_SECRET|\/home\/private/);
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
  }
});
