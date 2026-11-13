import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  classifyStartupOutput,
  classifyDeniedOperation,
} from '../mydevil/manual-dev-panel-startup-diagnose.mjs';

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
test('classifies Next runtime manifest, SWC, module format and filesystem errors',()=>{
  const cases=[
    ['ENOENT: no such file or directory, open /private/path/.next/server/font-manifest.json', 'MISSING_RUNTIME_FILE'],
    ["Could not find a production build in the '.next' directory", 'NEXT_BUILD_ID_MISSING'],
    ['Failed to load SWC binary for freebsd/x64', 'NEXT_NATIVE_PLATFORM'],
    ['ERR_REQUIRE_ESM when loading config', 'MODULE_FORMAT_FAILURE'],
    ['ENOTDIR: cannot read a file as a folder', 'INVALID_RUNTIME_PATH_TYPE'],
    ['EACCES: permission denied, open /secret/path', 'RUNTIME_PERMISSION_DENIED'],
    ['Error: Something unrecognized and sensitive', 'UNCLASSIFIED_APPLICATION_ERROR'],
  ];
  for (const [message, expected] of cases) {
    const result=classifyStartupOutput(message + '\n' + SECRET,1,null);
    assert.equal(result.category,expected);
    assert.doesNotMatch(JSON.stringify(result),/PRIVATE_DIAGNOSTIC_TEST_SECRET|private\/path|secret\/path/);
  }
});
test('sanitizes permission operation and address without leaking paths',()=>{
  assert.deepEqual(
    classifyDeniedOperation('Error: bind EACCES: permission denied 0.0.0.0:35123 ' + SECRET),
    {operation:'BIND',target:'WILDCARD_ADDRESS'},
  );
  assert.deepEqual(
    classifyDeniedOperation("Error: EACCES: permission denied, open '/home/user/.next/server/private.json' " + SECRET),
    {operation:'OPEN',target:'NEXT_BUILD'},
  );
  assert.deepEqual(
    classifyDeniedOperation('Error: listen EACCES: permission denied 127.0.0.1:2134'),
    {operation:'LISTEN',target:'LOOPBACK_ADDRESS'},
  );
  assert.deepEqual(
    classifyDeniedOperation('successful startup, nothing denied'),
    {operation:'NOT_DETECTED',target:'NOT_DETECTED'},
  );
  assert.doesNotMatch(JSON.stringify(
    classifyDeniedOperation('EACCES at /home/secret/customer/file ' + SECRET),
  ),/secret|customer|PRIVATE_DIAGNOSTIC/);
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
    assert.match(result.stdout,/STAGED_BUILD_SERVER_APP=FOUND/);
    assert.match(result.stdout,/STAGED_BIND_LOOPBACK=(PASS|PERMISSION_DENIED|UNAVAILABLE)/);
    assert.match(result.stdout,/STAGED_BIND_WILDCARD=(PASS|PERMISSION_DENIED|UNAVAILABLE)/);
    // Synthetic child fails because a module is missing, not because
    // any filesystem/socket syscall was rejected by the OS.
    assert.match(result.stdout,/STAGED_DENIED_OPERATION=NOT_DETECTED/);
    assert.match(result.stdout,/STAGED_DENIED_TARGET=NOT_DETECTED/);
    assert.match(result.stdout,/STAGED_BUILD_FONT_MANIFEST=MISSING/);
    assert.match(result.stdout,/LIVE_RUNTIME_MUTATIONS=NONE/);
    assert.doesNotMatch(result.stdout+result.stderr,/PRIVATE_DIAGNOSTIC_TEST_SECRET|\/home\/private/);
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
  }
});
