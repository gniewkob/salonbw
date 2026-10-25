import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('preview is read-only and invalid environments fail closed', () => {
  const result=spawnSync('bash',['scripts/deploy-environment.sh','development','all','HEAD'],{encoding:'utf8',env:{...process.env,GITHUB_OUTPUT:'/dev/null'}});
  assert.equal(result.status,0); assert.match(result.stdout,/Preview only/);
  assert.match(result.stdout,/dev-api.salon-bw.pl/);
  assert.equal(spawnSync('bash',['scripts/deploy-environment.sh','unknown','all','HEAD']).status,2);
});
test('a failed API deploy prevents any frontend dispatch', () => {
  const folder=mkdtempSync(path.join(os.tmpdir(),'salonbw-dispatch-'));
  try {
    const log=path.join(folder,'calls');
    writeFileSync(path.join(folder,'gh'),`#!/usr/bin/env bash
printf '%s\n' "$*" >> "$DISPATCH_LOG"
case "$1 $2" in
  'workflow run') exit 0;;
  'run list') printf '[{"databaseId":123,"createdAt":"9999-01-01T00:00:00Z","displayTitle":"Deploy staging api %s"}]' "$EXPECTED_SHA";;
  'run watch') exit 1;;
esac
`,{mode:0o700});
    const sha=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
    const result=spawnSync('bash',['scripts/deploy-environment.sh','development','all','HEAD','--execute'],{encoding:'utf8',env:{...process.env,PATH:folder+':'+process.env.PATH,DISPATCH_LOG:log,EXPECTED_SHA:sha}});
    assert.equal(result.status,1);
    const calls=readFileSync(log,'utf8');
    assert.match(calls,/target=api/); assert.doesNotMatch(calls,/target=frontends/);
  } finally { rmSync(folder,{recursive:true,force:true}); }
});
