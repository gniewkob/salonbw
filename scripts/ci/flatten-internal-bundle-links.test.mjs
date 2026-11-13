import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { flattenInternalBundleLinks } from './flatten-internal-bundle-links.mjs';

const script = fileURLToPath(new URL('./flatten-internal-bundle-links.mjs', import.meta.url));
const SECRET = 'DO_NOT_PRINT_PRIVATE_BUNDLE_CONTENT';

function fixture(callback) {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'salonbw-links-'));
    const root = path.join(parent, 'bundle');
    fs.mkdirSync(root);
    try {
        callback({root, parent});
    } finally {
        fs.rmSync(parent, {recursive: true, force: true});
    }
}

test('flattens internal relative file links without leaking paths or contents', () => {
    fixture(({root}) => {
        fs.mkdirSync(path.join(root, 'public'));
        fs.writeFileSync(path.join(root, 'public', 'asset.js'), SECRET);
        fs.symlinkSync('./asset.js', path.join(root, 'public', 'alias.js'));
        const result = spawnSync(process.execPath, [script, root], {
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /BUNDLE_LINK_NORMALIZATION=PASS/);
        assert.match(result.stdout, /BUNDLE_INTERNAL_FILE_LINKS=1/);
        assert.doesNotMatch(result.stdout + result.stderr, /asset\.js|alias\.js|DO_NOT_PRINT/);
        const alias = path.join(root, 'public', 'alias.js');
        assert.equal(fs.lstatSync(alias).isSymbolicLink(), false);
        assert.equal(fs.readFileSync(alias, 'utf8'), SECRET);
    });
});

test('flattens safe intra-bundle directory links, preserving structure', () => {
    fixture(({root}) => {
        fs.mkdirSync(path.join(root, 'data'));
        fs.writeFileSync(path.join(root, 'data', 'asset.css'), 'safe');
        fs.symlinkSync('./data', path.join(root, 'copy'));
        const counts = flattenInternalBundleLinks(root);
        assert.equal(counts.directoryLinks, 1);
        assert.equal(fs.lstatSync(path.join(root, 'copy')).isDirectory(), true);
        assert.equal(fs.lstatSync(path.join(root, 'copy')).isSymbolicLink(), false);
        assert.equal(fs.readFileSync(path.join(root, 'copy', 'asset.css'), 'utf8'), 'safe');
    });
});

test('breaks hardlinks so tar does not encode link records', () => {
    fixture(({root, parent}) => {
        fs.writeFileSync(path.join(root, 'a.js'), SECRET);
        fs.linkSync(path.join(root, 'a.js'), path.join(root, 'b.js'));
        const counts = flattenInternalBundleLinks(root);
        assert.ok(counts.hardlinkCopies >= 1);
        assert.notEqual(
            fs.statSync(path.join(root, 'a.js')).ino,
            fs.statSync(path.join(root, 'b.js')).ino,
        );
        const archive = path.join(parent, 'output.tar.gz');
        const create = spawnSync('tar', ['-czf', archive, '-C', root, '.'], {
            encoding: 'utf8',
        });
        assert.equal(create.status, 0, create.stderr);
        const list = spawnSync('tar', ['-tvzf', archive], {encoding:'utf8'});
        assert.equal(list.status, 0, list.stderr);
        assert.equal(list.stdout.split('\n').some(s => /^[lh]/.test(s)), false);
    });
});

test('rejects symlinks pointing outside bundle without modifying them', () => {
    fixture(({root, parent}) => {
        fs.writeFileSync(path.join(parent, 'private'), SECRET);
        fs.symlinkSync('../private', path.join(root, 'bad-link'));
        assert.throws(() => flattenInternalBundleLinks(root), /external-link-rejected/);
        assert.equal(fs.lstatSync(path.join(root, 'bad-link')).isSymbolicLink(), true);
        const result = spawnSync(process.execPath, [script, root], {
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /BUNDLE_LINK_NORMALIZATION=BLOCKED/);
        assert.doesNotMatch(result.stderr + result.stdout, /private|bad-link|DO_NOT_PRINT/);
    });
});

test('rejects dangling symlinks without disclosing their targets', () => {
    fixture(({root}) => {
        fs.symlinkSync('nonexistent-private-file', path.join(root, 'dangling'));
        assert.throws(() => flattenInternalBundleLinks(root));
        const result = spawnSync(process.execPath, [script, root], {
            encoding:'utf8',
        });
        assert.notEqual(result.status, 0);
        assert.doesNotMatch(result.stderr + result.stdout, /nonexistent-private-file|dangling/);
    });
});

test('rejects directory link cycles', () => {
    fixture(({root}) => {
        fs.mkdirSync(path.join(root, 'data'));
        fs.symlinkSync('..', path.join(root, 'data', 'loop'));
        assert.throws(() => flattenInternalBundleLinks(root));
    });
});

test('rejects symlinked bundle root', () => {
    fixture(({root, parent}) => {
        const alias = path.join(parent, 'alias');
        fs.symlinkSync(root, alias);
        assert.throws(() => flattenInternalBundleLinks(alias), /unsafe-bundle-root/);
    });
});
