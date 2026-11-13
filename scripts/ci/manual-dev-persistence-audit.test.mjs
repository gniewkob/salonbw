import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const current = path.dirname(fileURLToPath(import.meta.url));
const auditSource = fs.readFileSync(
    path.join(current, '../mydevil/manual-dev-persistence-audit.mjs'),
    'utf8',
);
const SHA = 'a'.repeat(40);
const SECRET_SENTINEL = 'TEST_PRIVATE_CONTENT_DO_NOT_LEAK';

function createFixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'salonbw-persistence-test-'));
    const home = path.join(root, 'home');
    const live = path.join(home, 'apps/nodejs/panelbw_dev');
    const source = path.join(home, '.salonbw-manual/sources', SHA);
    const domainDir = path.join(home, 'domains/dev-panel.salon-bw.pl');
    fs.mkdirSync(path.join(live, 'public/customers'), {recursive:true});
    fs.mkdirSync(path.join(live, 'tmp'), {recursive:true});
    fs.mkdirSync(path.join(source, 'apps/panel/public'), {recursive:true});
    fs.mkdirSync(domainDir, {recursive:true});
    fs.writeFileSync(path.join(source, '.salonbw-source-sha'), SHA + '\n');
    fs.writeFileSync(path.join(live, 'public/logo.svg'), '<svg/>');
    fs.writeFileSync(path.join(source, 'apps/panel/public/logo.svg'), '<svg/>');
    fs.writeFileSync(path.join(live, 'public/customers/avatar.jpg'), SECRET_SENTINEL);
    fs.writeFileSync(path.join(live, 'public/__release.json'), '{"sha":"b"}');
    fs.writeFileSync(path.join(live, 'tmp/private.log'), SECRET_SENTINEL);
    fs.writeFileSync(path.join(live, '.env.runtime.json'), SECRET_SENTINEL);
    fs.symlinkSync(live, path.join(domainDir, 'public_nodejs'));
    fs.symlinkSync(path.join(home, 'not-to-be-followed'),
        path.join(live, 'public/external'));
    return {root, home, live, source, domainDir};
}
function scan(home, sha = SHA, target = 'panel') {
    return spawnSync(process.execPath, ['--input-type=module','-','--',sha,target], {
        input: auditSource,
        encoding: 'utf8',
        env: {...process.env,HOME:home},
        timeout: 10000,
    });
}
function withFixture(callback) {
    const fx = createFixture();
    try {
        callback(fx);
    } finally {
        fs.rmSync(fx.root, {recursive:true,force:true});
    }
}
test('reports fixed labels and counts, never sensitive contents or names', () => {
    withFixture(({home}) => {
        const result = scan(home);
        assert.equal(result.status,0,result.stderr);
        assert.match(result.stdout,/DEV_PERSISTENCE_AUDIT=PASS target=panel/);
        assert.match(result.stdout,/PATH_TMP=DIR_NONEMPTY/);
        assert.match(result.stdout,/PATH_ENV_RUNTIME=FILE/);
        assert.match(result.stdout,/PUBLIC_LIVE_ONLY_FILE_COUNT=1/);
        assert.match(result.stdout,/PUBLIC_LIVE_ONLY_DIRECTORY_COUNT=1/);
        assert.match(result.stdout,/PUBLIC_LIVE_SYMLINK_COUNT=1/);
        assert.match(result.stdout,/PERSISTENT_DATA_MAP=REVIEW_REQUIRED/);
        assert.match(result.stdout,/RUNTIME_MUTATIONS=NONE/);
        assert.doesNotMatch(result.stdout+result.stderr, /TEST_PRIVATE_CONTENT_DO_NOT_LEAK|avatar\.jpg|private\.log|external/);
    });
});
test('does not change file or symlink inventory', () => {
    withFixture(({home,live}) => {
        const filesBefore = fs.readdirSync(live).sort();
        const publicBefore = fs.readdirSync(path.join(live,'public')).sort();
        const secretBefore = fs.readFileSync(path.join(live,'.env.runtime.json'),'utf8');
        const result = scan(home);
        assert.equal(result.status,0,result.stderr);
        assert.deepEqual(fs.readdirSync(live).sort(),filesBefore);
        assert.deepEqual(fs.readdirSync(path.join(live,'public')).sort(),publicBefore);
        assert.equal(fs.readFileSync(path.join(live,'.env.runtime.json'),'utf8'),secretBefore);
    });
});
test('rejects domain symlink pointing at a different app', () => {
    withFixture(({home,domainDir}) => {
        const link = path.join(domainDir,'public_nodejs');
        const wrong = path.join(home,'apps/nodejs/wrong');
        fs.mkdirSync(wrong,{recursive:true});
        fs.unlinkSync(link);
        fs.symlinkSync(wrong,link);
        const result = scan(home);
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/domain-app-target-mismatch/);
    });
});
test('rejects forged source receipt', () => {
    withFixture(({home,source}) => {
        fs.writeFileSync(path.join(source,'.salonbw-source-sha'),'b'.repeat(40));
        const result = scan(home);
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/source-receipt-mismatch/);
    });
});
test('rejects symlinked live app', () => {
    withFixture(({home,live}) => {
        fs.renameSync(live,live+'.saved');
        fs.symlinkSync(live+'.saved',live);
        const result = scan(home);
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/unexpected-app-or-source-path/);
    });
});
