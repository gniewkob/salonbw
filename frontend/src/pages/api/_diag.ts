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
    const standalone = path.join(cwd, '.next', 'standalone');
    const standaloneNext = path.join(standalone, '.next');
    const standaloneStatic = path.join(standaloneNext, 'static');
    const rootStatic = path.join(cwd, '.next', 'static');
    const buildIdFile = path.join(cwd, '.next', 'BUILD_ID');
    const standaloneBuildIdFile = path.join(standaloneNext, 'BUILD_ID');

    let buildId: string | null = null;
    let sBuildId: string | null = null;
    try {
        buildId = fs.readFileSync(buildIdFile, 'utf8').trim();
    } catch {}
    try {
        sBuildId = fs.readFileSync(standaloneBuildIdFile, 'utf8').trim();
    } catch {}

    res.status(200).json({
        node: process.version,
        cwd,
        paths: {
            standalone: check(standalone),
            standaloneNext: { ...check(standaloneNext), target: standaloneNext },
            standaloneStatic: { ...check(standaloneStatic), target: standaloneStatic },
            rootStatic: { ...check(rootStatic), target: rootStatic },
            buildIdFile: { ...check(buildIdFile), target: buildIdFile },
            standaloneBuildIdFile: {
                ...check(standaloneBuildIdFile),
                target: standaloneBuildIdFile,
            },
        },
        buildId,
        standaloneBuildId: sBuildId,
    });
}

