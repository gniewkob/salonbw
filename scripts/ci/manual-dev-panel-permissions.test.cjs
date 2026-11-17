'use strict';
// Execute the *actual* inline FreeBSD panel stage permission normalization
// against disposable fixtures. No live app, network, or secrets involved.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const stageScript=fs.readFileSync(
  path.join(__dirname,'../mydevil/manual-dev-panel-stage.sh'),'utf8');
const code=stageScript.match(
  /node22 - "\$temp" <<'NODE'\n([\s\S]*?)\nNODE\n\nmkdir -p "\$temp\/tmp"/);
assert.ok(code,'stage permission normalizer must be embedded before publishing');

function fixture(run){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'salonbw-panel-perms-'));
  const stage=path.join(root,'.salonbw-manual/stage');
  fs.mkdirSync(path.join(stage,'public'),{recursive:true,mode:0o700});
  fs.mkdirSync(path.join(stage,'.next'),{mode:0o700});
  fs.mkdirSync(path.join(stage,'tmp'),{mode:0o700});
  fs.mkdirSync(path.join(stage,'node_modules/next'),{recursive:true,mode:0o700});
  for(const name of ['app.js','app.cjs','public/__release.json',
    '.next/BUILD_ID','node_modules/next/package.json']){
    fs.writeFileSync(path.join(stage,name),'synthetic',{mode:0o600});
  }
  fs.writeFileSync(path.join(stage,'start.sh'),'#!/bin/sh\nexit 0\n',
    {mode:0o700});
  const config=path.join(stage,'.env.runtime.json');
  fs.writeFileSync(config,'{"PRIVATE":"SYNTHETIC_TEST_VALUE"}',{mode:0o600});
  for(const name of ['public','.next','tmp','node_modules',
    'node_modules/next'])fs.chmodSync(path.join(stage,name),0o700);
  fs.chmodSync(stage,0o700);
  try{return run({root,stage,config});}
  finally{fs.rmSync(root,{recursive:true,force:true});}
}
function normalize(stage){
  return spawnSync(process.execPath,['-',stage],{
    input:code[1],encoding:'utf8',timeout:10000,
    env:{...process.env,HOME:path.dirname(path.dirname(stage))}
  });
}
const mode=file=>fs.lstatSync(file).mode&0o777;

test('normalizes only public runtime files and preserves private config',()=>{
  fixture(({stage,config})=>{
    const result=normalize(stage);
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/STAGED_PERMISSIONS_NORMALIZED=PASS/);
    for(const dir of ['', 'public','.next','node_modules','node_modules/next'])
      assert.equal(mode(path.join(stage,dir)),0o755,dir);
    for(const file of ['app.js','app.cjs','public/__release.json',
      '.next/BUILD_ID','node_modules/next/package.json'])
      assert.equal(mode(path.join(stage,file)),0o644,file);
    assert.equal(mode(path.join(stage,'start.sh')),0o755);
    assert.equal(mode(config),0o600);
    assert.equal(mode(path.join(stage,'tmp')),0o700);
  });
});

test('fails closed before chmod on unexpected private environment file',()=>{
  fixture(({stage})=>{
    fs.writeFileSync(path.join(stage,'.env.local'),'sensitive',{mode:0o600});
    const result=normalize(stage);
    assert.notEqual(result.status,0);
    assert.equal(mode(stage),0o700);
    assert.equal(mode(path.join(stage,'public')),0o700);
    assert.equal(mode(path.join(stage,'.env.local')),0o600);
  });
});

test('fails closed on symlink escaping the staged runtime',()=>{
  fixture(({root,stage})=>{
    fs.symlinkSync(root,path.join(stage,'outside'));
    const result=normalize(stage);
    assert.notEqual(result.status,0);
    assert.equal(mode(stage),0o700);
  });
});

test('ignores internal npm-style symlinks and does not rewrite link targets',()=>{
  fixture(({stage})=>{
    fs.mkdirSync(path.join(stage,'node_modules/.bin'),{mode:0o700});
    fs.symlinkSync('../next/package.json',
      path.join(stage,'node_modules/.bin/next'));
    const result=normalize(stage);
    assert.equal(result.status,0,result.stderr);
    assert.equal(mode(path.join(stage,'node_modules/.bin')),0o755);
    assert.equal(fs.readlinkSync(path.join(stage,'node_modules/.bin/next')),
      '../next/package.json');
  });
});

test('accepts internal symlink when staging root has a logical path alias',()=>{
  fixture(({root,stage})=>{
    const alias=path.join(path.dirname(root),path.basename(root)+'-alias');
    fs.symlinkSync(root,alias,'dir');
    try {
      fs.mkdirSync(path.join(stage,'node_modules/.bin'),{mode:0o700});
      fs.symlinkSync('../next/package.json',
        path.join(stage,'node_modules/.bin/next'));
      const logicalStage=path.join(alias,'.salonbw-manual/stage');
      assert.notEqual(fs.realpathSync(logicalStage),logicalStage);
      const result=normalize(logicalStage);
      assert.equal(result.status,0,result.stderr);
      assert.match(result.stdout,/STAGED_PERMISSIONS_NORMALIZED=PASS/);
      assert.equal(mode(path.join(stage,'public/__release.json')),0o644);
      assert.equal(mode(path.join(stage,'.env.runtime.json')),0o600);
    } finally {
      fs.unlinkSync(alias);
    }
  });
});

test('rejects normalization outside the private MyDevil staging namespace',()=>{
  fixture(({stage})=>{
    const result=spawnSync(process.execPath,['-',stage],{
      input:code[1],encoding:'utf8',timeout:10000,
      env:{...process.env,HOME:os.tmpdir()}
    });
    assert.notEqual(result.status,0);
    assert.equal(mode(stage),0o700);
  });
});
