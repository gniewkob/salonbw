import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export const PRESERVE_LABELS = new Set([
    'Recepcja',
    'Solarium',
    'Nie wskazano pracownika',
    'Podsumowanie',
    'Łącznie',
]);

export type Mapping = Map<string, string>;

export function normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text ? text : null;
}

export function looksLikeEmployeeHeader(row: unknown[]): boolean {
    return normalizeText(row[0]) === 'Pracownik';
}

export function shouldAnonymizeName(value: unknown): value is string {
    const text = normalizeText(value);
    if (!text) return false;
    if (PRESERVE_LABELS.has(text)) return false;
    if (text.startsWith('UWAGA:')) return false;
    return true;
}

export function getAlias(name: string, mapping: Mapping): string {
    const existing = mapping.get(name);
    if (existing) return existing;
    const alias = `Pracownik ${String(mapping.size + 1).padStart(2, '0')}`;
    mapping.set(name, alias);
    return alias;
}

export function anonymizeSheetRows(
    rows: unknown[][],
    mapping: Mapping,
): unknown[][] {
    let insideEmployeeTable = false;

    return rows.map((row) => {
        if (!Array.isArray(row) || row.length === 0) {
            return row;
        }

        if (looksLikeEmployeeHeader(row)) {
            insideEmployeeTable = true;
            return row;
        }

        if (!insideEmployeeTable) {
            return row;
        }

        const firstCell = normalizeText(row[0]);
        if (!firstCell) {
            return row;
        }

        if (firstCell === 'Podsumowanie') {
            insideEmployeeTable = false;
            return row;
        }

        if (!shouldAnonymizeName(firstCell)) {
            return row;
        }

        const next = [...row];
        next[0] = getAlias(firstCell, mapping);
        return next;
    });
}

export function makeSafeSheetName(name: string, usedNames: Set<string>): string {
    const base = name.slice(0, 31) || 'Sheet';
    let candidate = base;
    let counter = 1;

    while (usedNames.has(candidate)) {
        const suffix = `_${counter}`;
        const prefix = base.slice(0, Math.max(1, 31 - suffix.length));
        candidate = `${prefix}${suffix}`;
        counter += 1;
    }

    usedNames.add(candidate);
    return candidate;
}

export function loadMapping(filePath?: string): Mapping {
    if (!filePath) return new Map();
    if (!fs.existsSync(filePath)) return new Map();

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(parsed));
}

export function saveMapping(mapping: Mapping, filePath?: string): void {
    if (!filePath) return;
    fs.writeFileSync(
        filePath,
        `${JSON.stringify(Object.fromEntries(mapping.entries()), null, 2)}\n`,
        'utf8',
    );
}

export function defaultOutputPath(inputPath: string): string {
    return path.join(
        path.dirname(inputPath),
        `${path.parse(inputPath).name}_anon.xlsx`,
    );
}

export function anonymizeWorkbookFile(
    inputPath: string,
    outputPath: string,
    mapping: Mapping,
): { employeesAnonymized: number; employeesInMappingTotal: number } {
    const workbook = XLSX.readFile(inputPath);
    const initialMappingSize = mapping.size;
    const nextSheetNames = new Map<string, string>();
    const usedNames = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            defval: null,
            blankrows: true,
        });

        const anonymizedRows = anonymizeSheetRows(rows, mapping);
        workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(anonymizedRows);
        nextSheetNames.set(sheetName, makeSafeSheetName(sheetName, usedNames));
    }

    workbook.SheetNames = workbook.SheetNames.map(
        (name) => nextSheetNames.get(name) ?? name,
    );
    for (const [oldName, newName] of nextSheetNames.entries()) {
        if (oldName === newName) continue;
        workbook.Sheets[newName] = workbook.Sheets[oldName];
        delete workbook.Sheets[oldName];
    }

    XLSX.writeFile(workbook, outputPath);

    return {
        employeesAnonymized: mapping.size - initialMappingSize,
        employeesInMappingTotal: mapping.size,
    };
}
