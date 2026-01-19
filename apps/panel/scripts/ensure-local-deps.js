#!/usr/bin/env node
/**
 * Some of our CI sandboxes occasionally strip tiny runtime-only dependencies
 * such as `picocolors` from the hoisted `node_modules`. To keep local tasks
 * (build, e2e) working we make sure the packages exist with a minimal
 * implementation. When the real package is present this is a no-op.
 */

const fs = require('node:fs');
const path = require('node:path');

function ensureNextEnv() {
    const vendorDir = path.join(__dirname, '..', 'vendor', '@next', 'env');
    const vendorPkgPath = path.join(vendorDir, 'package.json');
    if (!fs.existsSync(vendorPkgPath)) {
        return;
    }
    let expectedVersion;
    try {
        const pkg = JSON.parse(fs.readFileSync(vendorPkgPath, 'utf8'));
        expectedVersion = pkg.version;
    } catch {
        return;
    }
    const nodeModuleTargets = [
        path.join(__dirname, '..', 'node_modules', '@next', 'env'),
        path.join(__dirname, '..', '..', 'node_modules', '@next', 'env'),
    ];

    const syncToTarget = (targetDir) => {
        if (!targetDir) return;

        let realTarget = targetDir;
        try {
            const stat = fs.lstatSync(targetDir);
            if (stat.isSymbolicLink()) {
                realTarget = fs.realpathSync(targetDir);
            }
        } catch {
            // Target missing: parent directories will be created below
        }

        const targetPkgPath = path.join(realTarget, 'package.json');
        if (fs.existsSync(targetPkgPath)) {
            try {
                const existingPkg = JSON.parse(
                    fs.readFileSync(targetPkgPath, 'utf8'),
                );
                if (existingPkg.version === expectedVersion) {
                    return;
                }
            } catch {
                // fall through to rehydrate package
            }
        }

        fs.rmSync(realTarget, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(realTarget), { recursive: true });
        fs.cpSync(vendorDir, realTarget, { recursive: true });
    };

    for (const targetDir of nodeModuleTargets) {
        syncToTarget(targetDir);
    }

    const pnpmStoreDir = path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        '.pnpm',
    );
    try {
        const entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith(`@next+env@`)) {
                const storeTarget = path.join(
                    pnpmStoreDir,
                    entry.name,
                    'node_modules',
                    '@next',
                    'env',
                );
                syncToTarget(storeTarget);
                continue;
            }
            if (entry.name.startsWith('next@')) {
                const bundledTarget = path.join(
                    pnpmStoreDir,
                    entry.name,
                    'node_modules',
                    '@next',
                    'env',
                );
                syncToTarget(bundledTarget);
            }
        }
    } catch {
        // ignore if pnpm virtual store not available
    }
}

function ensurePicocolors() {
    const vendorDir = path.join(__dirname, '..', 'vendor', 'picocolors');
    const vendorPkgPath = path.join(vendorDir, 'package.json');
    if (!fs.existsSync(vendorPkgPath)) {
        return;
    }
    let expectedVersion;
    try {
        const pkg = JSON.parse(fs.readFileSync(vendorPkgPath, 'utf8'));
        expectedVersion = pkg.version;
    } catch {
        return;
    }
    const nodeModuleTargets = [
        path.join(__dirname, '..', 'node_modules', 'picocolors'),
        path.join(__dirname, '..', '..', 'node_modules', 'picocolors'),
    ];
    for (const targetDir of nodeModuleTargets) {
        const targetPkgPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(targetPkgPath)) {
            try {
                const existingPkg = JSON.parse(
                    fs.readFileSync(targetPkgPath, 'utf8'),
                );
                if (existingPkg.version === expectedVersion) {
                    continue;
                }
            } catch {
                // fall through
            }
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(targetDir), { recursive: true });
        fs.cpSync(vendorDir, targetDir, { recursive: true });
    }

    const pnpmStoreDir = path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        '.pnpm',
    );
    try {
        const entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (!entry.name.startsWith(`picocolors@${expectedVersion}`)) {
                continue;
            }
            const storeTarget = path.join(
                pnpmStoreDir,
                entry.name,
                'node_modules',
                'picocolors',
            );
            fs.rmSync(storeTarget, { recursive: true, force: true });
            fs.mkdirSync(path.dirname(storeTarget), { recursive: true });
            fs.cpSync(vendorDir, storeTarget, { recursive: true });
        }
    } catch {
        // ignore if virtual store missing
    }
}

function ensureSwcHelpers() {
    const vendorDir = path.join(__dirname, '..', 'vendor', '@swc', 'helpers');
    const vendorPkgPath = path.join(vendorDir, 'package.json');
    if (!fs.existsSync(vendorPkgPath)) {
        return;
    }
    let expectedVersion;
    try {
        const pkg = JSON.parse(fs.readFileSync(vendorPkgPath, 'utf8'));
        expectedVersion = pkg.version;
    } catch {
        return;
    }
    const targets = [
        path.join(__dirname, '..', 'node_modules', '@swc', 'helpers'),
        path.join(__dirname, '..', '..', 'node_modules', '@swc', 'helpers'),
    ];
    for (const targetDir of targets) {
        const targetPkgPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(targetPkgPath)) {
            try {
                const existing = JSON.parse(
                    fs.readFileSync(targetPkgPath, 'utf8'),
                );
                if (existing.version === expectedVersion) {
                    continue;
                }
            } catch {
                // fall through
            }
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(targetDir), { recursive: true });
        fs.cpSync(vendorDir, targetDir, { recursive: true });
    }
}

function ensureStyledJsx() {
    const vendorDir = path.join(__dirname, '..', 'vendor', 'styled-jsx');
    const vendorPkgPath = path.join(vendorDir, 'package.json');
    if (!fs.existsSync(vendorPkgPath)) {
        return;
    }
    let expectedVersion;
    try {
        const pkg = JSON.parse(fs.readFileSync(vendorPkgPath, 'utf8'));
        expectedVersion = pkg.version;
    } catch {
        return;
    }
    const nodeModuleTargets = [
        path.join(__dirname, '..', 'node_modules', 'styled-jsx'),
        path.join(__dirname, '..', '..', 'node_modules', 'styled-jsx'),
    ];
    for (const targetDir of nodeModuleTargets) {
        const targetPkgPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(targetPkgPath)) {
            try {
                const existingPkg = JSON.parse(
                    fs.readFileSync(targetPkgPath, 'utf8'),
                );
                if (existingPkg.version === expectedVersion) {
                    continue;
                }
            } catch {
                // fall through
            }
        }
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(targetDir), { recursive: true });
        fs.cpSync(vendorDir, targetDir, { recursive: true });
    }

    const pnpmStoreDir = path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        '.pnpm',
    );
    try {
        const entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (!entry.name.startsWith(`styled-jsx@${expectedVersion}`)) {
                continue;
            }
            const storeTarget = path.join(
                pnpmStoreDir,
                entry.name,
                'node_modules',
                'styled-jsx',
            );
            fs.rmSync(storeTarget, { recursive: true, force: true });
            fs.mkdirSync(path.dirname(storeTarget), { recursive: true });
            fs.cpSync(vendorDir, storeTarget, { recursive: true });
        }
    } catch {
        // ignore if pnpm virtual store missing
    }
}

ensurePicocolors();
ensureSwcHelpers();
ensureStyledJsx();
ensureNextEnv();
