const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const gate = resolve(__dirname, 'check-api-production-dependencies.cjs');
const workflow = readFileSync(resolve(__dirname, '../../.github/workflows/deploy.yml'), 'utf8');
function fixture(extra = []) {
  const dir = mkdtempSync(join(tmpdir(), 'api-dependency-gate-'));
  const pkg = (path, name, version) => { const p = join(dir, 'node_modules', path); mkdirSync(p, { recursive: true }); writeFileSync(join(p, 'package.json'), JSON.stringify({ name, version })); };
  pkg('axios', 'axios', '1.20.0'); pkg('follow-redirects', 'follow-redirects', '1.16.2');
  for (const args of extra) pkg(...args);
  return dir;
}
function run(dir) { return spawnSync(process.execPath, [gate], { cwd: dir, encoding: 'utf8' }); }
test('accepts approved installed versions and optional package absence', () => {
  const dir = fixture([['ip-address', 'ip-address', '10.7.4'], ['js-yaml', 'js-yaml', '4.3.2']]);
  try { assert.equal(run(dir).status, 0); } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('rejects every unapproved nested version even when top-level is safe', () => {
  for (const [name, bad] of [['follow-redirects', '1.16.1'], ['ip-address', '10.3.1'], ['js-yaml', '5.2.2']]) {
    const dir = fixture([[`axios/node_modules/${name}`, name, bad]]);
    try { assert.notEqual(run(dir).status, 0, name); } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});
test('rejects missing expected dependency and unknown js-yaml major', () => {
  let dir = fixture([['js-yaml', 'js-yaml', '6.0.0']]);
  try { assert.notEqual(run(dir).status, 0); } finally { rmSync(dir, { recursive: true, force: true }); }
  dir = fixture(); rmSync(join(dir, 'node_modules/follow-redirects'), { recursive: true });
  try { assert.notEqual(run(dir).status, 0); } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('deployment ignores server lockfile and runs gate after install before migration and restart', () => {
  const install = workflow.indexOf('name: Install dependencies (backend)');
  const check = workflow.indexOf('name: Verify API dependency versions before restart');
  const migration = workflow.indexOf('name: Run DB migrations (api)');
  const restart = workflow.indexOf('name: Restart app (backend)');
  assert.ok(install > 0 && install < check && check < migration && migration < restart);
  assert.match(workflow.slice(install, check), /npm22 install --omit=dev --ignore-scripts --no-package-lock/);
  assert.match(workflow.slice(check, migration), /api-dependency-gate\.cjs/);
  const preflight = workflow.indexOf('name: Validate API dependency policy before upload');
  assert.ok(preflight > 0 && preflight < workflow.indexOf('name: Snapshot development runtime before mutation'));
  assert.match(workflow.slice(preflight, install), /git show.*GITHUB_SHA:scripts\/ci\/check-api-production-dependencies\.cjs/);
  assert.match(workflow.slice(preflight, install), /--manifest-only/);
});
test('frontend CI runs for either workspace dependency graph file', () => {
  const ci = readFileSync(resolve(__dirname, '../../.github/workflows/ci.yml'), 'utf8');
  for (const name of ['public', 'dashboard', 'admin']) {
    const section = ci.split(`            ${name}:\n`)[1]?.split(/\n            (?:public|dashboard|admin):|\n      - name:/)[0];
    assert.ok(section, name);
    assert.match(section, /- 'pnpm-lock\.yaml'/);
    assert.match(section, /- 'pnpm-workspace\.yaml'/);
  }
});
test('historical manifest without approved overrides is rejected before upload', () => {
  const dir = fixture();
  try {
    const manifest = join(dir, 'package.json');
    writeFileSync(manifest, JSON.stringify({ overrides: { 'follow-redirects': '1.16.1' } }));
    assert.notEqual(spawnSync(process.execPath, [gate, '--manifest-only', manifest]).status, 0);
    assert.equal(spawnSync(process.execPath, [gate, '--manifest-only', resolve(__dirname, '../../backend/salonbw-backend/package.json')]).status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
