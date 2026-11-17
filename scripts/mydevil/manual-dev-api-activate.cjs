#!/usr/bin/env node
'use strict';
// DEV-only release file switch. Fixed live root and domain are never renamed.
// Only explicit release slots move; uploads, public, scripts, tmp and
// .diagnostics stay where the application already reads/writes them.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SHA_RE = /^[a-f0-9]{40}$/;
const DIGEST_RE = /^[a-f0-9]{64}$/;
const SLOTS = Object.freeze([
  'dist', 'node_modules', 'package.json', 'package-lock.json',
  'npm-shrinkwrap.json', 'app.js', 'app.cjs', '.env',
  '.env.generated', '.salonbw-api-release.json',
]);
const REQUIRED = Object.freeze(['dist', 'node_modules', 'package.json', 'app.js', '.env']);

function check(ok, message) {
  if (!ok) throw Error(message);
}
function exists(p) {
  return fs.existsSync(p) || (() => { try { fs.lstatSync(p); return true; } catch { return false; } })();
}
function stat(p, type) {
  const st = fs.lstatSync(p);
  check(!st.isSymbolicLink(), 'symlink-not-allowed:'+path.basename(p));
  if (type === 'directory') check(st.isDirectory(), 'not-directory:'+path.basename(p));
  if (type === 'file') check(st.isFile(), 'not-file:'+path.basename(p));
  return st;
}
function buildPaths(home, sha) {
  check(SHA_RE.test(sha), 'invalid-sha');
  const root = path.join(home, '.salonbw-manual');
  return {
    home, sha, root,
    stage: path.join(root, 'staged-api', sha),
    archive: path.join(root, 'incoming', 'api-dev-'+sha+'.tar.gz'),
    backupParent: path.join(root, 'api-release-recovery'),
    backup: path.join(root, 'api-release-recovery', sha),
    lockParent: path.join(root, 'locks'),
    lock: path.join(root, 'locks', 'api-activate'),
    live: path.join(home, 'apps', 'nodejs', 'api_salonbw_dev'),
    domain: path.join(home, 'domains', 'dev-api.salon-bw.pl', 'public_nodejs'),
  };
}
function corePaths(p) {
  stat(p.root, 'directory');
  stat(path.dirname(p.stage), 'directory');
  stat(path.dirname(p.archive), 'directory');
  stat(p.live, 'directory');
  check(fs.lstatSync(p.domain).isSymbolicLink(), 'invalid-dev-domain-link');
  check(fs.realpathSync(p.domain) === fs.realpathSync(p.live), 'dev-domain-rerouted');
  for (const name of ['uploads', 'tmp', '.diagnostics', 'public', 'scripts']) {
    // These paths are intentionally preserved. Validate type if present.
    if (exists(path.join(p.live, name))) stat(path.join(p.live, name), 'directory');
  }
}
function releaseItems(root) {
  return SLOTS.filter(name => exists(path.join(root, name)));
}
function validateSlot(root, name) {
  check(SLOTS.includes(name), 'unexpected-release-slot');
  const target = path.join(root, name);
  stat(target, ['dist', 'node_modules'].includes(name) ? 'directory' : 'file');
  if (name === '.env') {
    check((fs.lstatSync(target).mode & 0o077) === 0, 'unsafe-private-env-permissions');
  }
}
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function parseEnv(raw) {
  const out = new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const m = /^\s*(?:export\s+)?([A-Za-z_][\w]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    check(!out.has(m[1]), 'duplicate-dev-env-key');
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out.set(m[1], value);
  }
  return out;
}
function checkRuntime(p) {
  const env = parseEnv(fs.readFileSync(path.join(p.stage, '.env'), 'utf8'));
  let db;
  try { db = new URL(env.get('DATABASE_URL')); } catch { throw Error('invalid-dev-database-url'); }
  check(env.get('APP_ENV') === 'development' &&
    env.get('APP_RELEASE') === p.sha &&
    env.get('AUTH_COOKIE_PREFIX') === 'dev_' &&
    env.get('OUTBOUND_DELIVERY_ENABLED') === 'false' &&
    env.get('SMSAPI_ENABLED') === 'false' &&
    env.get('DB_SYNCHRONIZE') !== 'true' &&
    db.hostname === 'pgsql0.mydevil.net' &&
    decodeURIComponent(db.pathname) === '/p11522_salonbw_d' &&
    decodeURIComponent(db.username) === 'p11522_salonbw_d' &&
    env.get('DEV_ACCESS_USER') && env.get('DEV_ACCESS_PASSWORD'),
    'dev-runtime-isolation-mismatch');
}
async function archiveDigest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function preflight(p, digest) {
  check(DIGEST_RE.test(digest), 'invalid-digest');
  corePaths(p);
  stat(p.stage, 'directory');
  stat(p.archive, 'file');
  const stageItems = releaseItems(p.stage);
  const liveItems = releaseItems(p.live);
  for (const item of REQUIRED) {
    check(stageItems.includes(item), 'stage-missing:'+item);
    check(liveItems.includes(item), 'live-missing:'+item);
  }
  check(stageItems.includes('.salonbw-api-release.json'), 'stage-release-metadata-missing');
  for (const item of stageItems) validateSlot(p.stage, item);
  for (const item of liveItems) validateSlot(p.live, item);
  const release = readJson(path.join(p.stage, '.salonbw-api-release.json'));
  check(release.sha === p.sha && release.target === 'api' &&
    release.environment === 'development', 'stage-release-metadata-mismatch');
  check(readJson(path.join(p.stage, 'package.json')).name === 'salonbw-backend',
    'stage-package-mismatch');
  checkRuntime(p);
  check(await archiveDigest(p.archive) === digest, 'archive-digest-mismatch');
  check(fs.statSync(p.stage).dev === fs.statSync(p.live).dev &&
    fs.statSync(p.root).dev === fs.statSync(p.live).dev,
    'cross-filesystem-move-forbidden');
  return { liveItems, stageItems };
}
function withLock(p, fn) {
  if (exists(p.lockParent)) stat(p.lockParent, 'directory');
  else fs.mkdirSync(p.lockParent, {mode:0o700});
  fs.mkdirSync(p.lock, {mode:0o700}); // EEXIST => no concurrent mutation
  try { return fn(); } finally { fs.rmdirSync(p.lock); }
}
function move(from, to) {
  check(exists(from), 'source-missing');
  check(!exists(to), 'destination-already-exists');
  fs.renameSync(from, to); // same filesystem; no second copy of node_modules
}
function saveJournal(p, journal) {
  fs.writeFileSync(path.join(p.backup, 'journal.json'),
    JSON.stringify(journal, null, 2) + '\n', {mode:0o600, flag:'wx'});
}
async function activate(p, digest, options={}) {
  const {liveItems, stageItems} = await preflight(p, digest);
  check(!exists(p.backup), 'backup-already-exists');
  if (exists(p.backupParent)) stat(p.backupParent, 'directory');
  return withLock(p, () => {
    check(!exists(p.backup), 'backup-already-exists');
    fs.mkdirSync(p.backupParent, {recursive:true,mode:0o700});
    fs.mkdirSync(p.backup, {mode:0o700});
    fs.mkdirSync(path.join(p.backup, 'files'), {mode:0o700});
    saveJournal(p, {sha:p.sha, digest, oldNames:liveItems, newNames:stageItems});
    let count=0;
    for (const name of liveItems) {
      move(path.join(p.live,name),path.join(p.backup,'files',name));
      if (++count === 2 && options.failAt === 'after-old-2') throw Error('synthetic-injected-failure');
    }
    count=0;
    for (const name of stageItems) {
      move(path.join(p.stage,name),path.join(p.live,name));
      if (++count === 2 && options.failAt === 'after-new-2') throw Error('synthetic-injected-failure');
    }
    fs.writeFileSync(path.join(p.backup, 'ACTIVATED'), '', {mode:0o600,flag:'wx'});
    return {sha:p.sha, backup:p.backup};
  });
}
function loadJournal(p) {
  stat(p.backup, 'directory');
  const journalFile=path.join(p.backup,'journal.json');
  stat(journalFile, 'file');
  const j=readJson(journalFile);
  check(j.sha === p.sha && DIGEST_RE.test(j.digest), 'invalid-recovery-journal');
  for (const names of [j.oldNames,j.newNames]) {
    check(Array.isArray(names) && names.length >= 5 &&
      names.every(n=>typeof n==='string'&&SLOTS.includes(n)) &&
      new Set(names).size===names.length, 'invalid-recovery-slot-list');
  }
  check(j.oldNames.includes('.env') && j.newNames.includes('.env'), 'recovery-env-missing');
  return j;
}
async function recover(p) {
  corePaths(p);
  stat(p.stage, 'directory');
  check(!exists(path.join(p.backup,'RECOVERED')), 'already-recovered');
  const j=loadJournal(p);
  return withLock(p, () => {
    check(!exists(path.join(p.backup,'RECOVERED')), 'already-recovered');
    const old=new Set(j.oldNames), newer=new Set(j.newNames);
    const saved=path.join(p.backup,'files');
    stat(saved,'directory');
    // Validate all possible collisions before making the first recovery move.
    for (const name of SLOTS) {
      const backupHas=exists(path.join(saved,name));
      const liveHas=exists(path.join(p.live,name));
      const stageHas=exists(path.join(p.stage,name));
      if (backupHas) {
        check(old.has(name), 'backup-has-unexpected-release-slot');
        validateSlot(saved,name);
        check(!liveHas || (newer.has(name) && !stageHas),
          'recovery-live-stage-collision');
      } else if (old.has(name)) {
        check(liveHas && stageHas, 'recovery-old-file-missing');
        validateSlot(p.live,name);
      } else {
        check(!liveHas || (newer.has(name) && !stageHas),
          'recovery-unexpected-live-file');
      }
      if (stageHas) validateSlot(p.stage,name);
      if (liveHas) validateSlot(p.live,name);
    }
    // Return activated candidate files into the former stage if needed.
    for (const name of j.newNames) {
      if (exists(path.join(p.live,name)) &&
         (exists(path.join(saved,name)) || !old.has(name))) {
        move(path.join(p.live,name),path.join(p.stage,name));
      }
    }
    for (const name of j.oldNames) {
      if (exists(path.join(saved,name))) move(path.join(saved,name),path.join(p.live,name));
    }
    fs.writeFileSync(path.join(p.backup,'RECOVERED'), '', {mode:0o600,flag:'wx'});
    return {sha:p.sha};
  });
}
async function main() {
  const [mode, sha, digest] = process.argv.slice(2);
  check(['--plan','--execute','--recover'].includes(mode), 'invalid-operation');
  check(SHA_RE.test(sha), 'invalid-sha');
  check((mode==='--recover' && !digest) ||
    (mode!=='--recover' && DIGEST_RE.test(digest)), 'invalid-arguments');
  check(process.platform === 'freebsd', 'freebsd-only');
  const home=process.env.HOME;
  check(/^\/(?:usr\/)?home\/vetternkraft$/.test(home), 'unexpected-host-home');
  const p=buildPaths(home,sha);
  if (mode==='--plan') {
    await preflight(p,digest);
    check(!exists(p.backup),'backup-already-exists');
    console.log('DEV_API_ACTIVATION_PLAN=PASS sha='+sha);
    console.log('HOST_MUTATIONS=NONE');
  } else if (mode==='--execute') {
    check(process.env.SALONBW_DEV_API_ACTIVATE_APPROVED_SHA===sha,'unapproved-activation');
    await activate(p,digest);
    console.log('DEV_API_RELEASE_FILES_ACTIVATED=PASS sha='+sha);
    console.log('ROLLBACK_GENERATION=READY');
  } else {
    check(process.env.SALONBW_DEV_API_RECOVER_APPROVED_SHA===sha,'unapproved-recovery');
    await recover(p);
    console.log('DEV_API_RELEASE_FILES_RECOVERED=PASS sha='+sha);
  }
  console.log('DEV_APP_ROOT=UNCHANGED');
  console.log('DEV_DOMAIN_MAPPING=UNCHANGED');
  console.log('PERSISTENT_PATHS=PRESERVED');
  console.log('DATABASE_MUTATIONS=NONE');
  console.log('PASSENGER_RESTART=NOT_STARTED');
  console.log('LIVE_HEALTH=NOT_VERIFIED');
}
// MyDevil runs this file through "node22 - < script". Node identifies that
// entry point as [stdin], for which require.main is undefined. An import
// from tests must remain inert, but both CLI forms must execute main().
if (require.main===module || (module.id==='[stdin]' && process.argv[1]==='-')) {
  main().catch(error => {
    console.error('DEV_API_ACTIVATION=BLOCKED reason='+error.message.replace(/[^a-zA-Z0-9:_-]/g,'-'));
    process.exitCode=1;
  });
}
module.exports={buildPaths,preflight,activate,recover};
