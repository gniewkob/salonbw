import path from 'path';
import { spawnSync } from 'child_process';

type CliArgs = {
    sourceKey: string;
    baseDir: string;
    mapPath?: string;
    outPath: string;
};

function usage(): never {
    console.error(
        'Usage: ts-node scripts/seed-versum-reference-db.ts [--source-key versum_downloads_2026_04_03] [--base-dir /Users/.../Downloads] [--map /tmp/versum-employee-anon/workers-map.json] [--out /tmp/versum-reference-snapshot.json]',
    );
    process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
    let sourceKey = 'versum_downloads_2026_04_03';
    let baseDir = '/Users/gniewkob/Downloads';
    let mapPath: string | undefined = '/tmp/versum-employee-anon/workers-map.json';
    let outPath = '/tmp/versum-reference-snapshot.json';

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg) continue;
        if (arg === '--source-key') {
            sourceKey = argv[i + 1] ?? sourceKey;
            i += 1;
            continue;
        }
        if (arg === '--base-dir') {
            baseDir = argv[i + 1] ?? baseDir;
            i += 1;
            continue;
        }
        if (arg === '--map') {
            mapPath = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--out') {
            outPath = argv[i + 1] ?? outPath;
            i += 1;
            continue;
        }
        usage();
    }

    return { sourceKey, baseDir, mapPath, outPath };
}

function runStep(args: string[]): void {
    const result = spawnSync('pnpm', args, {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: process.env,
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function main() {
    const { sourceKey, baseDir, mapPath, outPath } = parseArgs(
        process.argv.slice(2),
    );

    const extractArgs = [
        'extract:versum-reference',
        '--out',
        outPath,
        '--base-dir',
        baseDir,
    ];
    if (mapPath) {
        extractArgs.push('--map', mapPath);
    }
    runStep(extractArgs);

    runStep([
        'save:versum-reference-db',
        '--snapshot',
        outPath,
        '--source-key',
        sourceKey,
    ]);

    runStep([
        'verify:versum-reference-db',
        '--source-key',
        sourceKey,
    ]);

    console.log(
        JSON.stringify(
            {
                status: 'ok',
                sourceKey,
                snapshotPath: path.resolve(outPath),
                sourceBaseDir: path.resolve(baseDir),
            },
            null,
            2,
        ),
    );
}

main();
