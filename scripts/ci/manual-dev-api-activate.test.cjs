'use strict';
// Synthetic-only DEV API activation/recovery contract; no network or host writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildPaths, preflight, activate, recover } = require('../mydevil/manual-dev-api-activate.cjs');

const SHA = 'b5d1886b8bbd004e3c7d30a7724cae673d7879ef';
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
function write(file, data, mode) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data, mode == null ? undefined : { mode });
}
function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'salonbw-api-activate-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const p = buildPaths(home, SHA);
  fs.mkdirSync(p.live, { recursive: true });
  fs.mkdirSync(p.stage, { recursive: true });
  fs.mkdirSync(path.dirname(p.domain), { recursive: true });
  fs.symlinkSync(p.live, p.domain);
  fs.mkdirSync(path.dirname(p.archive), { recursive: true });
  fs.mkdirSync(p.root, { recursive: true });
  write(p.archive, 'synthetic-archive');
  const digest = sha256('synthetic-archive');
  for (const item of ['dist', 'node_modules']) {
    write(path.join(p.live, item, 'index.js'), 'old');
    write(path.join(p.stage, item, 'index.js'), 'new');
  }
  write(path.join(p.live, 'app.js'), 'old');
  write(path.join(p.stage, 'app.js'), 'new');
  write(path.join(p.live, 'package.json'), JSON.stringify({name:'old-api'}));
  write(path.join(p.stage, 'package.json'), JSON.stringify({name:'salonbw-backend'}));
  write(path.join(p.live, '.env'), 'APP_ENV=development\nAPP_RELEASE=old\n', 0o600);
  write(path.join(p.stage, '.env'), [
    'APP_ENV=development', 'APP_RELEASE='+SHA, 'AUTH_COOKIE_PREFIX=dev_',
    'OUTBOUND_DELIVERY_ENABLED=false', 'SMSAPI_ENABLED=false',
    'DB_SYNCHRONIZE=false',
    'DATABASE_URL=postgresql://p11522_salonbw_d:secret@pgsql0.mydevil.net/p11522_salonbw_d',
    'DEV_ACCESS_USER=synthetic', 'DEV_ACCESS_PASSWORD=synthetic'
  ].join('\n')+'\n', 0o600);
  write(path.join(p.stage, '.salonbw-api-release.json'), JSON.stringify({sha:SHA,target:'api',environment:'development'}));
  for (const item of ['uploads', 'tmp', 'public', 'scripts', '.diagnostics']) {
    write(path.join(p.live, item, 'sentinel.txt'), 'persist-'+item);
  }
  return { p, digest };
}

function checkProtected(p) {
  for (const item of ['uploads', 'tmp', 'public', 'scripts', '.diagnostics']) {
    assert.equal(fs.readFileSync(path.join(p.live,item,'sentinel.txt'),'utf8'),'persist-'+item);
  }
  assert.equal(fs.realpathSync(p.domain),fs.realpathSync(p.live));
}

test('plan is read-only and rejects invalid SHA/digest', async t => {
  const {p, digest} = fixture(t);
  await preflight(p,digest);
  assert.equal(fs.existsSync(p.backup),false);
  checkProtected(p);
  await assert.rejects(preflight(p,'0'.repeat(64)),/digest/);
  checkProtected(p);
});

test('activate and recover exact files, retaining all five persistent paths', async t => {
  const {p,digest} = fixture(t);
  await activate(p,digest);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'new');
  assert.equal(fs.readFileSync(path.join(p.backup,'files','app.js'),'utf8'),'old');
  checkProtected(p);
  await assert.rejects(activate(p,digest),/stage|backup|already/);
  await recover(p);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'old');
  assert.equal(fs.readFileSync(path.join(p.stage,'app.js'),'utf8'),'new');
  checkProtected(p);
  await assert.rejects(recover(p),/already|recovered/);
});

test('recover after synthetic failure between old and new moves', async t => {
  const {p,digest} = fixture(t);
  await assert.rejects(activate(p,digest,{failAt:'after-old-2'}),/synthetic/);
  await recover(p);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'old');
  assert.equal(fs.readFileSync(path.join(p.stage,'app.js'),'utf8'),'new');
  checkProtected(p);
});

test('recover after interrupted deployment with partly populated new live', async t => {
  const {p,digest} = fixture(t);
  await assert.rejects(activate(p,digest,{failAt:'after-new-2'}),/synthetic/);
  await recover(p);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'old');
  assert.equal(fs.readFileSync(path.join(p.stage,'app.js'),'utf8'),'new');
  checkProtected(p);
});

test('corrupted recovery generation blocks before altering active release', async t => {
  const {p,digest}=fixture(t);
  await activate(p,digest);
  fs.rmSync(path.join(p.backup,'files','.env'));
  await assert.rejects(recover(p),/recovery-old-file-missing/);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'new');
  checkProtected(p);
});

test('reject altered metadata, unsafe root mapping and missing runtime config', async t => {
  const {p,digest}=fixture(t);
  write(path.join(p.stage,'.salonbw-api-release.json'),JSON.stringify({sha:'0'.repeat(40),target:'api',environment:'development'}));
  await assert.rejects(preflight(p,digest),/release|sha/i);
  fs.unlinkSync(path.join(p.stage,'.salonbw-api-release.json'));
  write(path.join(p.stage,'.salonbw-api-release.json'),JSON.stringify({sha:SHA,target:'api',environment:'development'}));
  fs.unlinkSync(p.domain);
  fs.symlinkSync(p.stage,p.domain);
  await assert.rejects(preflight(p,digest),/domain/);
  fs.unlinkSync(p.domain);
  fs.symlinkSync(p.live,p.domain);
  fs.unlinkSync(path.join(p.stage,'.env'));
  await assert.rejects(preflight(p,digest),/env|runtime/i);
});

test('reject existing backup to prevent overwrites or duplicate activation', async t => {
  const {p,digest}=fixture(t);
  fs.mkdirSync(p.backup,{recursive:true});
  await assert.rejects(activate(p,digest),/backup|already/);
  assert.equal(fs.readFileSync(path.join(p.live,'app.js'),'utf8'),'old');
});
