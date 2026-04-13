import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

type Row = unknown[];

type CliArgs = {
    outPath: string;
    mapPath?: string;
    baseDir: string;
};

type StringMap = Record<string, string>;

function usage(): never {
    console.error(
        'Usage: ts-node scripts/extract-versum-reference-snapshot.ts [--out /tmp/versum-reference-snapshot.json] [--map /tmp/versum-employee-anon/workers-map.json] [--base-dir /Users/gniewkob/Downloads]',
    );
    process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
    let outPath = '/tmp/versum-reference-snapshot.json';
    let mapPath: string | undefined;
    let baseDir = '/Users/gniewkob/Downloads';

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg) continue;
        if (arg === '--out') {
            outPath = argv[i + 1] ?? outPath;
            i += 1;
            continue;
        }
        if (arg === '--map') {
            mapPath = argv[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--base-dir') {
            baseDir = argv[i + 1] ?? baseDir;
            i += 1;
            continue;
        }
        usage();
    }

    return { outPath, mapPath, baseDir };
}

function readWorkbookRows(filePath: string): Row[] {
    const wb = XLSX.readFile(filePath);
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Row>(firstSheet, {
        header: 1,
        defval: null,
        blankrows: false,
    });
}

function text(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function numeric(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;
    const parsed = Number(String(value).replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isNaN(parsed) ? null : parsed;
}

function findHeaderIndex(rows: Row[], requiredColumns: string[]): number {
    return rows.findIndex((row) => {
        const cells = row.map((cell) => text(cell));
        return requiredColumns.every((col) => cells.includes(col));
    });
}

function loadEmployeeMap(filePath?: string): StringMap {
    if (!filePath) return {};
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as StringMap;
}

function mapEmployee(name: string, mapping: StringMap): string {
    if (!name) return name;
    return mapping[name] ?? name;
}

function parseCommissions(rows: Row[], mapping: StringMap) {
    const headerIdx = findHeaderIndex(rows, [
        'Pracownik',
        'Obroty na usługach brutto',
        'Łącznie prowizja brutto',
    ]);
    if (headerIdx < 0) return { items: [], summary: null };

    const items: Array<Record<string, unknown>> = [];
    let summary: Record<string, unknown> | null = null;
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const employeeRaw = text(row[0]);
        if (!employeeRaw) continue;
        if (employeeRaw === 'Podsumowanie') continue;
        if (employeeRaw.startsWith('UWAGA:')) break;
        if (employeeRaw === 'Łącznie') {
            summary = {
                employee: employeeRaw,
                serviceGross: numeric(row[1]),
                serviceNet: numeric(row[2]),
                serviceCommissionGross: numeric(row[3]),
                serviceCommissionNet: numeric(row[4]),
                productGross: numeric(row[5]),
                productNet: numeric(row[6]),
                productCommissionGross: numeric(row[7]),
                productCommissionNet: numeric(row[8]),
                totalGross: numeric(row[9]),
                totalCommissionGross: numeric(row[10]),
            };
            continue;
        }

        items.push({
            employee: mapEmployee(employeeRaw, mapping),
            serviceGross: numeric(row[1]),
            serviceNet: numeric(row[2]),
            serviceCommissionGross: numeric(row[3]),
            serviceCommissionNet: numeric(row[4]),
            productGross: numeric(row[5]),
            productNet: numeric(row[6]),
            productCommissionGross: numeric(row[7]),
            productCommissionNet: numeric(row[8]),
            totalGross: numeric(row[9]),
            totalCommissionGross: numeric(row[10]),
        });
    }

    return { items, summary };
}

function parseTips(rows: Row[], mapping: StringMap) {
    const headerIdx = findHeaderIndex(rows, [
        'Pracownik',
        'Ilość',
        'Wartość napiwków',
    ]);
    if (headerIdx < 0) return { items: [], summary: null };

    const items: Array<Record<string, unknown>> = [];
    let summary: Record<string, unknown> | null = null;
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const employeeRaw = text(row[0]);
        if (!employeeRaw) continue;
        if (employeeRaw.startsWith('UWAGA:')) break;
        if (employeeRaw === 'Podsumowanie') {
            summary = {
                cash: numeric(row[2]),
                card: numeric(row[3]),
                cheque: numeric(row[4]),
                transfer: numeric(row[5]),
                totalTips: numeric(row[6]),
            };
            continue;
        }

        items.push({
            employee: mapEmployee(employeeRaw, mapping),
            count: numeric(row[1]),
            cash: numeric(row[2]),
            card: numeric(row[3]),
            cheque: numeric(row[4]),
            transfer: numeric(row[5]),
            totalTips: numeric(row[6]),
        });
    }

    return { items, summary };
}

function parseServicePopularityByEmployee(rows: Row[], mapping: StringMap) {
    const items: Array<Record<string, unknown>> = [];
    let currentEmployee: string | null = null;

    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const first = text(row[0]);
        const second = text(row[1]);
        const third = text(row[2]);

        if (!first) continue;
        if (first.startsWith('UWAGA:')) break;
        if (first === 'Podsumowanie') continue;

        // Employee section header row, e.g. "Aleksandra Bodora | null | Sfinalizowane"
        if (!second && third === 'Sfinalizowane') {
            currentEmployee = mapEmployee(first, mapping);
            continue;
        }

        // Table header inside employee section
        if (first === 'Kategoria/Usługa/Wariant usługi') {
            continue;
        }

        if (!currentEmployee) continue;

        const paidTotal = numeric(row[2]);
        const pendingValue = numeric(row[5]);
        if (paidTotal === null && pendingValue === null) continue;

        items.push({
            employee: currentEmployee,
            node: first.trim(),
            sharePercent: numeric(row[1]),
            paidTotal,
            totalDurationMinutes: numeric(row[3]),
            visitsCount: numeric(row[4]),
            pendingValue,
            pendingDurationMinutes: numeric(row[6]),
            pendingVisitsCount: numeric(row[7]),
        });
    }
    return items;
}

function parseCountWithPercent(value: unknown): {
    count: number | null;
    percent: number | null;
} {
    const raw = text(value);
    if (!raw) return { count: null, percent: null };
    const match = raw.match(/(\d+)\s*\(([\d,]+)%\)/);
    if (!match) return { count: numeric(raw), percent: null };
    return {
        count: numeric(match[1]),
        percent: numeric(match[2]?.replace(',', '.')),
    };
}

function parseReturningCustomers(rows: Row[], mapping: StringMap) {
    const headerIdx = findHeaderIndex(rows, [
        'Pracownik',
        'Liczba obsłużonych klientów',
        'Liczba klientów powracających do salonu',
    ]);
    if (headerIdx < 0) return { items: [], summary: null };
    const items: Array<Record<string, unknown>> = [];
    let summary: Record<string, unknown> | null = null;
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const employeeRaw = text(row[0]);
        if (!employeeRaw) continue;
        if (employeeRaw.startsWith('UWAGA:')) break;
        if (employeeRaw === 'Podsumowanie') {
            const salon = parseCountWithPercent(row[3]);
            const worker = parseCountWithPercent(row[4]);
            summary = {
                servicedClientsCount: numeric(row[1]),
                firstVisitsCount: numeric(row[2]),
                returningToSalonCount: salon.count,
                returningToSalonPercent: salon.percent,
                returningToWorkerCount: worker.count,
                returningToWorkerPercent: worker.percent,
            };
            continue;
        }

        const salon = parseCountWithPercent(row[3]);
        const worker = parseCountWithPercent(row[4]);
        items.push({
            employee: mapEmployee(employeeRaw, mapping),
            servicedClientsCount: numeric(row[1]),
            firstVisitsCount: numeric(row[2]),
            returningToSalonCount: salon.count,
            returningToSalonPercent: salon.percent,
            returningToWorkerCount: worker.count,
            returningToWorkerPercent: worker.percent,
        });
    }
    return { items, summary };
}

function parseServicePopularity(rows: Row[]) {
    const headerIdx = findHeaderIndex(rows, [
        'Kategoria/Usługa/Wariant usługi',
        'Udział % w obrocie na usługach',
    ]);
    if (headerIdx < 0) return [];
    const items: Array<Record<string, unknown>> = [];
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const node = text(row[0]);
        if (!node) continue;
        if (node === 'Podsumowanie' || node.startsWith('UWAGA:')) break;
        const paidTotal = numeric(row[2]);
        const pendingValue = numeric(row[5]);
        if (paidTotal === null && pendingValue === null) continue;
        items.push({
            node: node.trim(),
            sharePercent: numeric(row[1]),
            paidTotal,
            totalDurationMinutes: numeric(row[3]),
            visitsCount: numeric(row[4]),
            pendingValue,
            pendingDurationMinutes: numeric(row[6]),
            pendingVisitsCount: numeric(row[7]),
        });
    }
    return items;
}

function parseCustomerOrigins(rows: Row[]) {
    const headerIdx = findHeaderIndex(rows, [
        'Pochodzenie klientów',
        'Ilość klientów',
        'Łączny obrót',
    ]);
    if (headerIdx < 0) return [];
    const items: Array<Record<string, unknown>> = [];
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
        const row = rows[i] ?? [];
        const origin = text(row[0]);
        if (!origin) continue;
        if (origin === 'Podsumowanie' || origin.startsWith('UWAGA:')) break;
        items.push({
            origin,
            clientsCount: numeric(row[1]),
            visitingClientsCount: numeric(row[2]),
            totalTurnover: numeric(row[3]),
            averageTurnover: numeric(row[4]),
        });
    }
    return items;
}

function parseFinancialSummary(rows: Row[]) {
    const summary: Record<string, unknown> = {};
    for (let i = 0; i < Math.min(rows.length, 40); i += 1) {
        const row = rows[i] ?? [];
        const key = text(row[0]);
        const value = row[1];
        if (!key || !key.endsWith(':')) continue;
        summary[key.slice(0, -1)] = value;
    }
    return summary;
}

function main() {
    const { outPath, mapPath, baseDir } = parseArgs(process.argv.slice(2));
    const employeeMap = loadEmployeeMap(mapPath);

    const files = {
        commissions: path.join(
            baseDir,
            '19581_prowizje_od_2000-01-01_do_2026-12-31.xls',
        ),
        tips: path.join(baseDir, '19581_napiwki_od_2000-01-01_do_2026-12-31.xls'),
        servicePopularityByEmployee: path.join(
            baseDir,
            '19581_popularnosc_uslug_wg_pracownikow_od_2000-01-01_do_2026-12-31.xlsx',
        ),
        returningCustomers: path.join(
            baseDir,
            '19581_raport_powracalnosci_klientow_wygenerowany_2026-04-03.xlsx',
        ),
        servicePopularity: path.join(
            baseDir,
            '19581_popularnosc_uslug_od_2000-01-01_do_2026-12-31.xlsx',
        ),
        customerOrigins: path.join(
            baseDir,
            '19581_raport_od_2000-01-01_do_2026-12-31.xlsx',
        ),
        financial: path.join(
            baseDir,
            '19581_raport_finansowy_od_2000-01-01_do_2026-12-31.xlsx',
        ),
    };

    const rows = Object.fromEntries(
        Object.entries(files).map(([key, filePath]) => [key, readWorkbookRows(filePath)]),
    ) as Record<keyof typeof files, Row[]>;

    const snapshot = {
        generatedAt: new Date().toISOString(),
        sourceBaseDir: baseDir,
        employeeMapApplied: Boolean(mapPath),
        employeeMapPath: mapPath ?? null,
        metrics: {
            commissions: parseCommissions(rows.commissions, employeeMap),
            tips: parseTips(rows.tips, employeeMap),
            servicePopularityByEmployee: parseServicePopularityByEmployee(
                rows.servicePopularityByEmployee,
                employeeMap,
            ),
            returningCustomers: parseReturningCustomers(
                rows.returningCustomers,
                employeeMap,
            ),
            servicePopularity: parseServicePopularity(rows.servicePopularity),
            customerOrigins: parseCustomerOrigins(rows.customerOrigins),
            financialSummary: parseFinancialSummary(rows.financial),
        },
    };

    fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(
        JSON.stringify(
            {
                outPath,
                sourceBaseDir: baseDir,
                employeeMapPath: mapPath ?? null,
                counts: {
                    commissions: snapshot.metrics.commissions.items.length,
                    tips: snapshot.metrics.tips.items.length,
                    servicePopularityByEmployee:
                        snapshot.metrics.servicePopularityByEmployee.length,
                    returningCustomers:
                        snapshot.metrics.returningCustomers.items.length,
                    servicePopularity: snapshot.metrics.servicePopularity.length,
                    customerOrigins: snapshot.metrics.customerOrigins.length,
                },
            },
            null,
            2,
        ),
    );
}

main();
