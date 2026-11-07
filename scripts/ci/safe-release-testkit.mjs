// Synthetic fixtures for safe-release tests. No network, no hosting paths.
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const shaOf = (seed) => crypto.createHash('sha1').update(String(seed)).digest('hex');
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export const PLATFORM = Object.freeze({ platform: 'freebsd', arch: 'x64', nodeMajor: 22, modulesAbi: '127', npmMajor: 10 });

export function makeSandbox() {
    const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'safe-release-')));
    const allowedRoot = path.join(base, 'home');
    const root = path.join(allowedRoot, 'apps', 'nodejs', 'panelbw_dev.releases');
    fs.mkdirSync(path.join(root, 'shared'), { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(root, 'shared', '.env.runtime.json'), JSON.stringify({ APP_ENV: 'development', SYNTHETIC: 'not-a-secret' }), { mode: 0o600 });
    fs.chmodSync(path.join(root, 'shared', '.env.runtime.json'), 0o600);
    fs.mkdirSync(path.join(allowedRoot, 'uploads'), { recursive: true });
    fs.writeFileSync(path.join(allowedRoot, 'uploads', 'user-photo.txt'), 'synthetic user data');
    return { base, allowedRoot, root, cleanup: () => fs.rmSync(base, { recursive: true, force: true }) };
}

export function lockFor(pkg) {
    const packages = { '': { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies } };
    if (pkg.devDependencies) packages[''].devDependencies = pkg.devDependencies;
    for (const [name, range] of Object.entries(pkg.dependencies)) {
        const version = range.replace(/^[\^~]/, '');
        packages[`node_modules/${name}`] = {
            version,
            resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
            integrity: `sha512-${Buffer.from(name + version).toString('base64')}`,
        };
    }
    for (const [name, range] of Object.entries(pkg.devDependencies || {})) {
        const version = range.replace(/^[\^~]/, '');
        packages[`node_modules/${name}`] = {
            version,
            dev: true,
            resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
            integrity: `sha512-${Buffer.from(name + version).toString('base64')}`,
        };
    }
    return { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true, packages };
}

const APP_CJS = `const fs = require('fs');
const path = require('path');
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', '__release.json'), 'utf8'));
const dep = require('synthetic-dep');
const build = fs.readFileSync(path.join(__dirname, '.next', 'BUILD_ID'), 'utf8').trim();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.env.runtime.json'), 'utf8'));
module.exports = (req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ sha: meta.sha, build, dep: dep.version, env: config.APP_ENV }));
};
`;

// Builds a release tarball. `mutate(bundleDir)` allows negative fixtures.
export function makeArtifact(workDir, { sha, depVersion = '1.0.0', mutate } = {}) {
    const bundle = path.join(workDir, `bundle-${sha.slice(0, 8)}-${crypto.randomBytes(3).toString('hex')}`);
    fs.mkdirSync(path.join(bundle, '.next', 'static', 'chunks'), { recursive: true });
    fs.mkdirSync(path.join(bundle, 'public'), { recursive: true });
    const pkg = { name: '@salonbw/panel', version: '0.1.0', private: true, dependencies: { 'synthetic-dep': depVersion }, devDependencies: { 'synthetic-test-tool': '9.9.9' } };
    fs.writeFileSync(path.join(bundle, 'package.json'), JSON.stringify(pkg, null, 2));
    fs.writeFileSync(path.join(bundle, 'package-lock.json'), JSON.stringify(lockFor(pkg), null, 2));
    fs.writeFileSync(path.join(bundle, '.next', 'BUILD_ID'), `build-${sha.slice(0, 8)}\n`);
    fs.writeFileSync(path.join(bundle, '.next', 'static', 'chunks', `main-${sha.slice(0, 8)}.js`), `console.log(${JSON.stringify(sha)});\n`);
    fs.writeFileSync(path.join(bundle, 'public', '__release.json'), JSON.stringify({ sha, environment: 'development', buildId: `build-${sha.slice(0, 8)}` }));
    fs.writeFileSync(path.join(bundle, 'app.cjs'), APP_CJS);
    if (mutate) mutate(bundle);
    const archivePath = `${bundle}.tar.gz`;
    const out = spawnSync('tar', ['-czf', archivePath, '-C', bundle, '.']);
    if (out.status !== 0) throw new Error('fixture tar failed');
    return { archivePath, archiveSha256: sha256(fs.readFileSync(archivePath)), bundle };
}

// Fake `npm ci`: materializes lockfile entries without network.
export function fakeInstaller({ failTimes = 0, skipPackageJsonFor = null, delayMs = 0 } = {}) {
    const state = { calls: 0, cwds: [] };
    const installer = async ({ cwd, lock }) => {
        state.calls += 1;
        state.cwds.push(cwd);
        if (delayMs) await sleep(delayMs);
        if (state.calls <= failTimes) {
            fs.mkdirSync(path.join(cwd, 'node_modules', 'half-written'), { recursive: true });
            throw Object.assign(new Error('synthetic npm ci failure'), { code: 'INSTALL_FAILED' });
        }
        for (const [key, entry] of Object.entries(lock.packages)) {
            if (key === '' || entry.dev) continue;
            const dir = path.join(cwd, key);
            fs.mkdirSync(dir, { recursive: true });
            const name = key.replace(/^node_modules\//, '');
            if (name !== skipPackageJsonFor) fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: entry.version, main: 'index.js' }));
            fs.writeFileSync(path.join(dir, 'index.js'), `module.exports = { version: ${JSON.stringify(entry.version)} };\n`);
        }
    };
    return { installer, state };
}

// ------------------------------------------------------- mock Passenger ---
// Each worker resolves `current` ONCE at spawn (as Passenger/Node do via
// realpath(__dirname)) and keeps serving that release until replaced.
export class MockPassenger {
    constructor(root) {
        this.root = root;
        this.worker = null;
        this.port = null;
        this.restarts = 0;
    }
    async spawnWorker() {
        const child = spawn(process.execPath, [path.join(here, 'safe-release-mock-worker.cjs'), path.join(this.root, 'current')], { stdio: ['ignore', 'pipe', 'pipe'] });
        const port = await new Promise((resolve, reject) => {
            let buf = '';
            let err = '';
            child.stdout.on('data', (d) => {
                buf += d;
                const m = /PORT (\d+)/.exec(buf);
                if (m) resolve(Number(m[1]));
            });
            child.stderr.on('data', (d) => (err += d));
            child.on('exit', (code) => reject(new Error(`worker exited ${code}: ${err.slice(0, 300)}`)));
        });
        return { child, port };
    }
    // Start-new-then-stop-old, like a graceful Passenger restart.
    async restart() {
        const next = await this.spawnWorker();
        const old = this.worker;
        this.worker = next.child;
        this.port = next.port;
        this.restarts += 1;
        if (old) old.kill('SIGTERM');
    }
    async get() {
        const res = await fetch(`http://127.0.0.1:${this.port}/`);
        return { status: res.status, body: await res.json() };
    }
    adapter({ failHealthFor = null, failRestartFor = null } = {}) {
        return {
            restart: async (sha) => {
                if (sha === failRestartFor) throw new Error('synthetic restart failure');
                await this.restart();
            },
            healthcheck: async (sha) => {
                if (sha === failHealthFor) throw new Error('synthetic healthcheck failure');
                const { status, body } = await this.get();
                if (status !== 200 || body.sha !== sha) throw new Error(`served ${body.sha} instead of ${sha}`);
            },
        };
    }
    stop() {
        if (this.worker) this.worker.kill('SIGTERM');
        this.worker = null;
    }
}

// Minimal ustar writer to craft hostile archives (e.g. "../evil") that
// regular tar CLIs refuse to create portably.
export function writeHostileTar(file, entries) {
    const blocks = [];
    for (const { name, content = '' } of entries) {
        const body = Buffer.from(content);
        const header = Buffer.alloc(512, 0);
        header.write(name, 0, 100, 'utf8');
        header.write('0000644\0', 100);
        header.write('0000000\0', 108);
        header.write('0000000\0', 116);
        header.write(body.length.toString(8).padStart(11, '0') + '\0', 124);
        header.write('00000000000\0', 136);
        header.write('        ', 148);
        header.write('0', 156);
        header.write('ustar\0', 257);
        header.write('00', 263);
        let sum = 0;
        for (const b of header) sum += b;
        header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
        blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512, 0));
    }
    blocks.push(Buffer.alloc(1024, 0));
    fs.writeFileSync(file, zlib.gzipSync(Buffer.concat(blocks)));
}
