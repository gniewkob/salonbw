'use strict';

// LOCAL MODEL ONLY: no inputs, host paths, network, DB, Passenger or deployment.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const ids = { A: 'a'.repeat(40), B: 'b'.repeat(40) };

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'salonbw-recovery-model-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const releases = path.join(root, 'releases');
    const data = path.join(root, 'data');
    fs.mkdirSync(releases); fs.mkdirSync(data);
    for (const [name, value] of Object.entries({ '.env': 'synthetic env', upload: 'synthetic upload', db: 'synthetic db' })) {
        fs.writeFileSync(path.join(data, name), value);
    }
    const expected = {};
    for (const id of Object.values(ids)) {
        const dir = path.join(releases, id); fs.mkdirSync(dir);
        const payload = `synthetic release ${id}`;
        fs.writeFileSync(path.join(dir, 'app.js'), payload);
        expected[id] = { 'app.js': digest(payload) };
    }
    const pointer = path.join(root, 'active'); fs.writeFileSync(pointer, ids.A);
    return { root, releases, data, pointer, expected };
}

function verify(model, id) {
    if (!/^[a-f0-9]{40}$/.test(id) || !Object.hasOwn(model.expected, id)) throw Error('unknown release');
    const dir = path.join(model.releases, id);
    if (!fs.lstatSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink()) throw Error('unsafe release');
    const expected = model.expected[id];
    const names = fs.readdirSync(dir).sort();
    if (JSON.stringify(names) !== JSON.stringify(Object.keys(expected).sort())) throw Error('unexpected or missing files');
    for (const name of names) {
        if (name !== path.basename(name) || name === '.' || name === '..') throw Error('invalid path');
        const file = path.join(dir, name), stat = fs.lstatSync(file);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw Error('unsafe file');
        if (digest(fs.readFileSync(file)) !== expected[name]) throw Error('digest mismatch');
    }
}

function switchRelease(model, target, fault) {
    const previous = fs.readFileSync(model.pointer, 'utf8');
    verify(model, previous); verify(model, target);
    if (fault === 'before') throw Error('injected before switch');
    const pending = path.join(model.root, 'active.pending');
    fs.writeFileSync(pending, target, { flag: 'wx' });
    fs.renameSync(pending, model.pointer);
    if (fault === 'after') throw Error('injected after switch');
}

function snapshot(model) {
    return { active: fs.readFileSync(model.pointer, 'utf8'), data: fs.readdirSync(model.data).sort().map(n => [n, digest(fs.readFileSync(path.join(model.data, n)))]) };
}

test('switch A→B→A→B without changing synthetic data', t => {
    const m = fixture(t), before = snapshot(m);
    for (const id of [ids.B, ids.A, ids.B]) { switchRelease(m, id); assert.equal(snapshot(m).active, id); assert.deepEqual(snapshot(m).data, before.data); }
});

test('reject unknown or malformed release before switching', t => {
    const m = fixture(t), before = snapshot(m);
    for (const id of ['../outside', 'c'.repeat(40)]) assert.throws(() => switchRelease(m, id));
    assert.deepEqual(snapshot(m), before);
});

test('reject changed, missing, and extra files before switching', t => {
    for (const kind of ['changed', 'missing', 'extra']) {
        const m = fixture(t), before = snapshot(m), dir = path.join(m.releases, ids.B), app = path.join(dir, 'app.js');
        if (kind === 'changed') fs.writeFileSync(app, 'changed');
        if (kind === 'missing') fs.unlinkSync(app);
        if (kind === 'extra') fs.writeFileSync(path.join(dir, 'extra'), 'extra');
        assert.throws(() => switchRelease(m, ids.B)); assert.deepEqual(snapshot(m), before);
    }
});

test('reject symlinks, hard links, and untrusted prior release', t => {
    for (const kind of ['symlink', 'hardlink', 'prior']) {
        const m = fixture(t), before = snapshot(m), target = path.join(m.releases, ids.B, 'app.js');
        if (kind === 'prior') fs.writeFileSync(path.join(m.releases, ids.A, 'app.js'), 'corrupt');
        else { fs.unlinkSync(target); if (kind === 'symlink') fs.symlinkSync(path.join(m.data, '.env'), target); else fs.linkSync(path.join(m.data, '.env'), target); }
        assert.throws(() => switchRelease(m, ids.B)); assert.deepEqual(snapshot(m), before);
    }
});

test('failure before switch leaves state unchanged', t => {
    const m = fixture(t), before = snapshot(m);
    assert.throws(() => switchRelease(m, ids.B, 'before')); assert.deepEqual(snapshot(m), before);
});

test('failure after switch requires explicit checked return', t => {
    const m = fixture(t), before = snapshot(m);
    assert.throws(() => switchRelease(m, ids.B, 'after'));
    assert.equal(snapshot(m).active, ids.B); assert.deepEqual(snapshot(m).data, before.data);
    switchRelease(m, ids.A); assert.deepEqual(snapshot(m), before);
});

test('failed return is refused if previous release was corrupted', t => {
    const m = fixture(t), before = snapshot(m);
    assert.throws(() => switchRelease(m, ids.B, 'after'));
    fs.writeFileSync(path.join(m.releases, ids.A, 'app.js'), 'corrupt');
    assert.throws(() => switchRelease(m, ids.A));
    assert.equal(snapshot(m).active, ids.B); assert.deepEqual(snapshot(m).data, before.data);
});
