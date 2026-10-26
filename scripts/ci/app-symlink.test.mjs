import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const helper=path.resolve('scripts/mydevil/ensure-app-symlink.sh');
function fixture(run){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'salonbw-links-'));
 try{
  const home=path.join(temp,'home'),alias=path.join(temp,'alias');
  const app=path.join(home,'apps/nodejs/fixture');
  const domain=path.join(home,'domains/fixture.example/public_nodejs');
  fs.mkdirSync(app,{recursive:true});fs.mkdirSync(path.dirname(domain),{recursive:true});fs.symlinkSync(home,alias);
  const verify=()=>spawnSync('bash',[helper,'fixture.example','apps/nodejs/fixture'],{encoding:'utf8',env:{...process.env,HOME:home}});
  run({home,alias,app,domain,verify});
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
test('same app through an account-home alias is accepted without replacing its link',()=>fixture(({alias,app,domain,verify})=>{
 const original=path.join(alias,'apps/nodejs/fixture');fs.symlinkSync(original,domain);
 fs.writeFileSync(path.join(app,'preserved'),'fixture');
 assert.equal(verify().status,0);assert.equal(fs.readlinkSync(domain),original);
 assert.equal(fs.readFileSync(path.join(app,'preserved'),'utf8'),'fixture');
}));
test('different application link and an existing domain directory are preserved and rejected',()=>fixture(({home,domain,verify})=>{
 const other=path.join(home,'apps/nodejs/other');fs.mkdirSync(other);fs.symlinkSync(other,domain);
 assert.notEqual(verify().status,0);assert.equal(fs.readlinkSync(domain),other);
 fs.unlinkSync(domain);fs.mkdirSync(domain);fs.writeFileSync(path.join(domain,'preserved'),'fixture');
 assert.notEqual(verify().status,0);assert.equal(fs.readFileSync(path.join(domain,'preserved'),'utf8'),'fixture');
}));
