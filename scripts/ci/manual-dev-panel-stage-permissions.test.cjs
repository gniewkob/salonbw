'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(
  path.resolve(__dirname, '../mydevil/manual-dev-panel-stage.sh'),
  'utf8',
);
const match = source.match(
  /node22 - "\$temp" <<'STAGE_PERMISSIONS'\r?\n([\s\S]*?)\r?\nSTAGE_PERMISSIONS/,
);
assert.ok(match, 'staging must contain the executable permission normalizer');
assert.ok(
  source.indexOf("node22 - \"$temp\" <<'STAGE_PERMISSIONS'") <
    source.indexOf('mv "$temp" "$final"'),
  'normalization must precede publishing the staged release',
);
const normalizer = match[1];

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sbw-stage-modes-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const mkdir = (relative) =>
    fs.mkdirSync(path.join(root, relative), { recursive: true, mode: 0o700 });
  const write = (relative, content = 'fixture', mode = 0o600) =>
    fs.writeFileSync(path.join(root, relative), content, { mode });

  mkdir('tmp');
  mkdir('public');
  mkdir('.next');
  mkdir('node_modules/.bin');
  mkdir('node_modules/pkg');
  write('public/__release.json', '{}');
  write('public/favicon.ico');
  write('.next/BUILD_ID');
  write('.env.runtime.json', '{}');
  write('node_modules/pkg/run', 'echo fixture', 0o700);
  fs.symlinkSync('../pkg/run', path.join(root, 'node_modules/.bin/run'));

  return { root, write };
}

const mode = (p) => fs.statSync(p).mode & 0o777;
function run(root) {
  return spawnSync(process.execPath, ['-', root], {
    input: normalizer,
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('staged assets become readable while runtime secrets stay private', (t) => {
  const { root, write } = fixture(t);
  write('private.pem');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /STAGED_PERMISSIONS=PASS/);

  for (const relative of ['', 'public', '.next', 'node_modules', 'node_modules/.bin']) {
    assert.equal(mode(path.join(root, relative)), 0o755, relative);
  }
  for (const relative of ['public/__release.json', 'public/favicon.ico', '.next/BUILD_ID']) {
    assert.equal(mode(path.join(root, relative)), 0o644, relative);
  }
  assert.equal(mode(path.join(root, 'node_modules/pkg/run')), 0o755);
  assert.equal(mode(path.join(root, '.env.runtime.json')), 0o600);
  assert.equal(mode(path.join(root, 'private.pem')), 0o600);
  assert.equal(mode(path.join(root, 'tmp')), 0o700);
  assert.ok(fs.lstatSync(path.join(root, 'node_modules/.bin/run')).isSymbolicLink());
});

test('rejects nonempty Passenger tmp without changing permissions', (t) => {
  const { root, write } = fixture(t);
  write('tmp/restart.txt', '');
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected-tmp-content/);
  assert.equal(mode(root), 0o700);
  assert.equal(mode(path.join(root, 'public/__release.json')), 0o600);
});

test('rejects hardlinks before any permission updates', (t) => {
  const { root } = fixture(t);
  const outside = path.join(os.tmpdir(), 'sbw-stage-hardlink-' + process.pid);
  fs.writeFileSync(outside, 'fixture', { mode: 0o600 });
  t.after(() => fs.rmSync(outside, { force: true }));
  fs.linkSync(outside, path.join(root, 'public/hardlink'));
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected-hardlink/);
  assert.equal(mode(outside), 0o600);
  assert.equal(mode(root), 0o700);
});

test('rejects unsafe private configuration permissions', (t) => {
  const { root } = fixture(t);
  fs.chmodSync(path.join(root, '.env.runtime.json'), 0o644);
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid-private-input/);
  assert.equal(mode(root), 0o700);
});