import path from 'path';
import {
    anonymizeWorkbookFile,
    defaultOutputPath,
    loadMapping,
    saveMapping,
} from './lib/versum-employee-anonymizer';

type CliArgs = {
    inputFiles: string[];
    outDir?: string;
    mapInPath?: string;
    mapOutPath?: string;
};

function usage(): never {
    console.error(
        'Usage: ts-node scripts/anonymize-versum-employee-reports-batch.ts [--map-in map.json] [--map-out map.json] [--out-dir /tmp] <file1.xls[x]> <file2.xls[x]> ...',
    );
    process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
    const inputFiles: string[] = [];
    let outDir: string | undefined;
    let mapInPath: string | undefined;
    let mapOutPath: string | undefined;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg) continue;
        if (arg === '--map-in') {
            mapInPath = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--map-out') {
            mapOutPath = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--out-dir') {
            outDir = argv[i + 1];
            i += 1;
            continue;
        }
        inputFiles.push(arg);
    }

    if (inputFiles.length === 0) usage();
    return { inputFiles, outDir, mapInPath, mapOutPath };
}

function buildOutputPath(inputPath: string, outDir?: string): string {
    if (!outDir) return defaultOutputPath(inputPath);
    const base = `${path.parse(inputPath).name}_anon.xlsx`;
    return path.join(outDir, base);
}

function main() {
    const { inputFiles, outDir, mapInPath, mapOutPath } = parseArgs(
        process.argv.slice(2),
    );

    const mapping = loadMapping(mapInPath);
    const results: Array<{
        inputPath: string;
        outputPath: string;
        employeesAnonymized: number;
        employeesInMappingTotal: number;
    }> = [];

    for (const inputPath of inputFiles) {
        const outputPath = buildOutputPath(inputPath, outDir);
        const result = anonymizeWorkbookFile(inputPath, outputPath, mapping);
        results.push({
            inputPath,
            outputPath,
            employeesAnonymized: result.employeesAnonymized,
            employeesInMappingTotal: result.employeesInMappingTotal,
        });
    }

    saveMapping(mapping, mapOutPath);

    console.log(
        JSON.stringify(
            {
                inputFiles,
                outDir: outDir ?? null,
                mapInPath: mapInPath ?? null,
                mapOutPath: mapOutPath ?? null,
                filesProcessed: results.length,
                employeesInMappingTotal: mapping.size,
                mapping: Object.fromEntries(mapping.entries()),
                results,
            },
            null,
            2,
        ),
    );
}

main();
