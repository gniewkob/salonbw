import {
    anonymizeWorkbookFile,
    defaultOutputPath,
    loadMapping,
    saveMapping,
} from './lib/versum-employee-anonymizer';

function usage(): never {
    console.error(
        'Usage: ts-node scripts/anonymize-versum-employee-report.ts [--map-in map.json] [--map-out map.json] <input.xls[x]> [output.xlsx]',
    );
    process.exit(1);
}

type CliArgs = {
    inputPath: string;
    outputPath: string;
    mapInPath?: string;
    mapOutPath?: string;
};

function parseArgs(argv: string[]): CliArgs {
    let mapInPath: string | undefined;
    let mapOutPath: string | undefined;
    const positional: string[] = [];

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
        positional.push(arg);
    }

    const inputPath = positional[0];
    if (!inputPath) usage();

    const outputPath = positional[1] ?? defaultOutputPath(inputPath);
    return { inputPath, outputPath, mapInPath, mapOutPath };
}

function main() {
    const { inputPath, outputPath, mapInPath, mapOutPath } = parseArgs(
        process.argv.slice(2),
    );

    const mapping = loadMapping(mapInPath);
    const result = anonymizeWorkbookFile(inputPath, outputPath, mapping);
    saveMapping(mapping, mapOutPath);

    console.log(
        JSON.stringify(
            {
                inputPath,
                outputPath,
                mapInPath: mapInPath ?? null,
                mapOutPath: mapOutPath ?? null,
                employeesAnonymized: result.employeesAnonymized,
                employeesInMappingTotal: result.employeesInMappingTotal,
                mapping: Object.fromEntries(mapping.entries()),
            },
            null,
            2,
        ),
    );
}

main();
