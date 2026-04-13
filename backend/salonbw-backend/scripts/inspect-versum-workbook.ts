import * as XLSX from 'xlsx';

type Row = unknown[];

function usage(): never {
    console.error(
        'Usage: ts-node scripts/inspect-versum-workbook.ts <file.xls[x]> [maxRows]',
    );
    process.exit(1);
}

function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function scoreHeaderRow(row: Row): number {
    let score = 0;
    for (const cell of row) {
        const value = normalizeCell(cell);
        if (!value) continue;
        score += 1;
        if (/[A-Za-ząćęłńóśźż]/.test(value)) score += 0.5;
        if (value.length > 2 && value.length < 80) score += 0.5;
    }
    return score;
}

function findHeaderRow(rows: Row[]): { index: number; values: string[] } | null {
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
        const row = rows[i] ?? [];
        const score = scoreHeaderRow(row);
        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }
    if (bestIndex < 0) return null;
    return {
        index: bestIndex,
        values: (rows[bestIndex] ?? []).map((cell) => normalizeCell(cell)),
    };
}

function inspect(filePath: string, maxRows: number): void {
    const workbook = XLSX.readFile(filePath);
    const report = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
            header: 1,
            defval: null,
            blankrows: false,
        });
        const header = findHeaderRow(rows);
        return {
            sheetName,
            rowCount: rows.length,
            inferredHeaderRow: header?.index ?? null,
            inferredHeaders: header?.values ?? [],
            preview: rows.slice(0, maxRows),
        };
    });

    console.log(
        JSON.stringify(
            {
                filePath,
                sheets: workbook.SheetNames,
                report,
            },
            null,
            2,
        ),
    );
}

function main(): void {
    const filePath = process.argv[2];
    if (!filePath) usage();
    const maxRowsArg = process.argv[3];
    const maxRows = maxRowsArg ? Number(maxRowsArg) : 20;
    inspect(filePath, Number.isFinite(maxRows) && maxRows > 0 ? maxRows : 20);
}

main();
