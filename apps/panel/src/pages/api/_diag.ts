import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'node:fs';
import path from 'node:path';

function check(p: string) {
    try {
        const stat = fs.statSync(p);
        return { exists: true, type: stat.isDirectory() ? 'dir' : 'file' };
    } catch {
        return { exists: false };
    }
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    const cwd = process.cwd();
    // Next standalone server sets cwd to the standalone dir.
    // distRoot is the directory that contains Next's .next for the server runtime.
    // If cwd ends with ".next/standalone", distRoot is path.resolve(cwd, '..').
    const distRoot =
        path.basename(cwd) === 'standalone' ? path.resolve(cwd, '..') : cwd;
    const standalone = cwd; // actual standalone dir
    const standaloneNext = distRoot; // .next adjacent to server.js
    const standaloneStatic = path.join(standaloneNext, 'static');
    const rootStatic = path.join(path.resolve(distRoot, '..'), 'static');
    const buildIdFile = path.join(standaloneNext, 'BUILD_ID');

    let buildId: string | null = null;
    try {
        buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
    } catch {}
    // no-op: standaloneBuildIdFile removed (same as buildIdFile in standalone mode)

    let chunks: string[] = [];
    let css: string[] = [];
    try {
        chunks = fs.readdirSync(path.join(standaloneStatic, 'chunks'));
    } catch {}
    try {
        css = fs.readdirSync(path.join(standaloneStatic, 'css'));
    } catch {}

    res.status(200).json({
        node: process.version,
        cwd,
        paths: {
            standalone: check(standalone),
            standaloneNext: {
                ...check(standaloneNext),
                target: standaloneNext,
            },
            standaloneStatic: {
                ...check(standaloneStatic),
                target: standaloneStatic,
            },
            rootStatic: { ...check(rootStatic), target: rootStatic },
            buildIdFile: { ...check(buildIdFile), target: buildIdFile },
        },
        buildId,
        standaloneBuildId: buildId,
        staticSample: {
            chunks: chunks.slice(0, 10),
            css: css.slice(0, 10),
        },
    });
}
