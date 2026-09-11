import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'node:fs/promises';
import { Product, ProductType } from '../src/products/product.entity';
import {
    hasImportChanges,
    resolveStockUnits,
} from '../src/import/import-planning';

loadEnv();

type RawRow = Array<unknown>;

type ParsedProduct = {
    name: string;
    brand: string | null;
    description: string | null;
    sku: string | null;
    barcode: string | null;
    productType: ProductType;
    unitPrice: number;
    vatRate: number;
    purchasePrice: number | null;
    stock: number;
    unit: string | null;
    minQuantity: number | null;
    isActive: boolean;
    trackStock: boolean;
};

const HEADER_PRODUCT = 'Produkt';
const HEADER_PRODUCER = 'Producent';
const HEADER_NET_PRICE = 'Cena netto (zł)';
const HEADER_VAT = 'Stawka VAT';
const HEADER_GROSS_PRICE = 'Cena brutto (zł)';
const HEADER_LAST_PURCHASE_NET = 'Ostatnia cena zakupu netto';
const HEADER_STOCK_PACKAGES = 'Stan magazynowy w opakowaniach';
const HEADER_STOCK_UNITS = 'Stan magazynowy w jednostce zużycia';
const HEADER_PRODUCT_TYPE = 'Rodzaj produktu';
const HEADER_UNIT = 'Jednostka zużycia';
const HEADER_DESCRIPTION = 'Opis';
const HEADER_SKU = 'Kod wewnętrzny (SKU)';
const HEADER_BARCODE = 'Kod kreskowy';

function normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
    ) {
        return null;
    }
    const text = String(value).trim();
    return text ? text : null;
}

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
        if (!cleaned) return null;
        const num = Number(cleaned);
        return Number.isNaN(num) ? null : num;
    }
    return null;
}

function parsePercent(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
        if (Number.isNaN(value)) return null;
        return value > 1 ? value / 100 : value;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace('%', '').trim().replace(',', '.');
        if (!cleaned) return null;
        const num = Number(cleaned);
        if (Number.isNaN(num)) return null;
        return num > 1 ? num / 100 : num;
    }
    return null;
}

function normalizeCode(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && !Number.isNaN(value)) {
        const text = Number.isInteger(value) ? String(value) : String(value);
        return text.trim() || null;
    }
    if (typeof value !== 'string' && typeof value !== 'boolean') return null;
    const text = String(value).trim();
    return text || null;
}

function truncate(value: string | null, maxLength: number): string | null {
    if (!value) return null;
    return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function recordLengthConflict(
    value: string | null,
    maxLength: number,
    field: string,
    rowNumber: number,
    conflicts: string[],
): void {
    if (value && value.length > maxLength) {
        conflicts.push(
            `Row ${rowNumber}: ${field} exceeds ${maxLength} characters and would be truncated.`,
        );
    }
}

function roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeSection(section: string | null): string | null {
    if (!section) return null;
    const [root] = section.split('/');
    const normalized = root?.trim();
    return normalized || null;
}

function mapProductType(rawValue: string | null): ProductType {
    const normalized = rawValue?.toLowerCase() ?? '';
    if (normalized === 'materiał') return ProductType.Supply;
    if (normalized === 'towar') return ProductType.Product;
    if (normalized === 'towar i materiał') return ProductType.Universal;
    return ProductType.Product;
}

function isHeaderRow(row: RawRow): boolean {
    const first = normalizeText(row[0])?.toLowerCase();
    const second = normalizeText(row[1])?.toLowerCase();
    return (
        first === HEADER_PRODUCT.toLowerCase() &&
        second === HEADER_PRODUCER.toLowerCase()
    );
}

function isSectionRow(row: RawRow): boolean {
    const first = normalizeText(row[0]);
    if (!first) return false;
    for (let i = 1; i < row.length; i += 1) {
        if (normalizeText(row[i])) return false;
    }
    return true;
}

function makeBarcodeKey(barcode: string): string {
    return barcode.trim().toLowerCase();
}

function makeSkuNameKey(sku: string, name: string): string {
    return `${sku.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
}

function makeNameBrandKey(name: string, brand: string | null): string {
    return `${name.trim().toLowerCase()}::${(brand ?? '').trim().toLowerCase()}`;
}

function makeInputIdentity(product: ParsedProduct): string {
    if (product.barcode) return `barcode:${makeBarcodeKey(product.barcode)}`;
    if (product.sku) {
        return `sku-name:${makeSkuNameKey(product.sku, product.name)}`;
    }
    return `name-brand:${makeNameBrandKey(product.name, product.brand)}`;
}

function parseCsvLine(line: string, delimiter: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === delimiter) {
            fields.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    fields.push(current);
    return fields;
}

function parseCsvRows(input: string): RawRow[] {
    const normalized = input.replace(/^\uFEFF/, '');
    const lines = normalized
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0);

    if (lines.length === 0) {
        return [];
    }

    const sample = lines.slice(0, 5).join('\n');
    const semicolons = (sample.match(/;/g) || []).length;
    const commas = (sample.match(/,/g) || []).length;
    const delimiter = semicolons >= commas ? ';' : ',';

    return lines.map((line) =>
        parseCsvLine(line, delimiter).map((value) => value.trim()),
    );
}

async function loadRows(): Promise<RawRow[]> {
    const csvPath =
        process.env.IMPORT_PRODUCTS_CSV ||
        path.resolve(__dirname, '..', '..', '..', 'produkty.csv');
    const csvRaw = await fs.readFile(csvPath, 'utf8');
    return parseCsvRows(csvRaw);
}

async function run() {
    const rows = await loadRows();

    const headerIndex = rows.findIndex((row) => isHeaderRow(row));
    if (headerIndex === -1) {
        throw new Error('Cannot find product header row in workbook.');
    }

    const products: ParsedProduct[] = [];
    let currentSection: string | null = null;
    for (let i = 0; i < headerIndex; i += 1) {
        const preHeaderRow = rows[i] ?? [];
        if (isSectionRow(preHeaderRow)) {
            currentSection = normalizeText(preHeaderRow[0]);
        }
    }
    let skippedSectionRows = 0;
    let skippedHeaderRows = 0;
    let skippedInvalidRows = 0;
    const parseConflicts: string[] = [];

    for (
        let rowIndex = headerIndex + 1;
        rowIndex < rows.length;
        rowIndex += 1
    ) {
        const row = rows[rowIndex] ?? [];

        if (isHeaderRow(row)) {
            skippedHeaderRows += 1;
            continue;
        }

        if (isSectionRow(row)) {
            currentSection = normalizeText(row[0]);
            skippedSectionRows += 1;
            continue;
        }

        const rawName = normalizeText(row[0]);
        recordLengthConflict(
            rawName,
            200,
            'product name',
            rowIndex + 1,
            parseConflicts,
        );
        const name = truncate(rawName, 200);
        if (!name) {
            skippedInvalidRows += 1;
            continue;
        }

        const sectionBrand = normalizeSection(currentSection);
        const rawBrand = normalizeText(row[1]) ?? sectionBrand;
        const rawSku = normalizeCode(row[12]);
        const rawBarcode = normalizeCode(row[13]);
        const rawUnit = normalizeText(row[9]);
        recordLengthConflict(
            rawBrand,
            100,
            'brand',
            rowIndex + 1,
            parseConflicts,
        );
        recordLengthConflict(rawSku, 50, 'SKU', rowIndex + 1, parseConflicts);
        recordLengthConflict(
            rawBarcode,
            50,
            'barcode',
            rowIndex + 1,
            parseConflicts,
        );
        recordLengthConflict(rawUnit, 20, 'unit', rowIndex + 1, parseConflicts);
        const brand = truncate(rawBrand, 100) ?? 'Nieznany producent';

        const vatRate = parsePercent(row[3]) ?? 0.23;
        const netPrice = parseNumber(row[2]);
        const grossPriceRaw = parseNumber(row[4]);
        const purchasePriceRaw = parseNumber(row[5]);
        let unitPrice = grossPriceRaw;

        if (unitPrice === null && netPrice !== null) {
            unitPrice = roundTo2(netPrice * (1 + vatRate));
        }

        if (unitPrice === null && purchasePriceRaw !== null) {
            unitPrice = roundTo2(purchasePriceRaw * (1 + vatRate));
        }

        if (unitPrice === null) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): a sale or purchase price is required.`,
            );
            unitPrice = 0;
        } else if (unitPrice < 0) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): price cannot be negative.`,
            );
        }
        if (purchasePriceRaw !== null && purchasePriceRaw < 0) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): purchase price cannot be negative.`,
            );
        }

        const stockUnits = parseNumber(row[7]);
        const stockPackages = parseNumber(row[6]);
        const stockResolution = resolveStockUnits(stockUnits, stockPackages);
        if (stockResolution.conflict) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): ${stockResolution.conflict}`,
            );
        }
        const stock = stockResolution.value ?? 0;

        const rawProductType = normalizeText(row[8]);
        if (
            rawProductType &&
            rawProductType.toLowerCase() === HEADER_PRODUCT_TYPE.toLowerCase()
        ) {
            skippedHeaderRows += 1;
            continue;
        }

        const parsed: ParsedProduct = {
            name,
            brand,
            description: normalizeText(row[11]),
            sku: truncate(rawSku, 50),
            barcode: truncate(rawBarcode, 50),
            productType: mapProductType(rawProductType),
            unitPrice: roundTo2(unitPrice),
            vatRate: roundTo2(vatRate * 100),
            purchasePrice:
                purchasePriceRaw === null ? null : roundTo2(purchasePriceRaw),
            stock,
            unit: truncate(rawUnit, 20),
            minQuantity: null,
            isActive: true,
            trackStock: true,
        };

        products.push(parsed);
    }

    const seenInputIdentities = new Set<string>();
    for (const product of products) {
        const identity = makeInputIdentity(product);
        if (seenInputIdentities.has(identity)) {
            parseConflicts.push(`Duplicate incoming product: ${identity}`);
        }
        seenInputIdentities.add(identity);
    }

    const parseOnly = process.env.IMPORT_PRODUCTS_PARSE_ONLY === '1';
    if (parseOnly) {
        console.log(
            `Parse-only finished. Parsed products: ${products.length}. No DB connection or changes.`,
        );
        console.log(
            `Rows skipped. Sections: ${skippedSectionRows}, repeated headers: ${skippedHeaderRows}, invalid: ${skippedInvalidRows}`,
        );
        if (parseConflicts.length > 0) {
            throw new Error(
                `Import blocked by conflicts:\n${parseConflicts.join('\n')}`,
            );
        }
        return;
    }

    if (
        process.env.IMPORT_PRODUCTS_APPLY === '1' &&
        process.env.IMPORT_PRODUCTS_DRY_RUN === '1'
    ) {
        throw new Error(
            'IMPORT_PRODUCTS_APPLY and IMPORT_PRODUCTS_DRY_RUN cannot both be enabled.',
        );
    }
    const apply = process.env.IMPORT_PRODUCTS_APPLY === '1';
    const replaceStock = process.env.IMPORT_PRODUCTS_REPLACE_STOCK === '1';

    if (apply && parseConflicts.length > 0) {
        throw new Error(
            `Import blocked by conflicts:\n${parseConflicts.join('\n')}`,
        );
    }

    const url = process.env.DATABASE_URL;
    const dbConfig = url
        ? { url }
        : {
              host: process.env.DB_HOST || process.env.PGHOST,
              port: parseInt(
                  process.env.DB_PORT || process.env.PGPORT || '5432',
                  10,
              ),
              username: process.env.DB_USER || process.env.PGUSER,
              password: process.env.DB_PASS || process.env.PGPASSWORD,
              database: process.env.DB_NAME || process.env.PGDATABASE,
          };

    if (!url && (!dbConfig.host || !dbConfig.username || !dbConfig.database)) {
        throw new Error(
            'Missing database configuration. Set DATABASE_URL or DB_* vars.',
        );
    }

    const dataSource = new DataSource({
        type: 'postgres',
        ...dbConfig,
        entities: [path.join(__dirname, '..', 'src', '**', '*.entity.{ts,js}')],
        ssl: process.env.PGSSL === '1' ? true : undefined,
    });

    const report = {
        mode: apply ? 'apply' : 'plan',
        productsCreate: 0,
        productsUpdate: 0,
        productsSkip: 0,
        stockReplace: 0,
        stockPreserve: 0,
        conflicts: parseConflicts,
    };

    await dataSource.initialize();
    try {
        await dataSource.transaction(async (manager) => {
            const productRepo = manager.getRepository(Product);
            const existingProducts = await productRepo.find();
            const byBarcode = new Map<string, Product>();
            const bySkuName = new Map<string, Product>();
            const byNameBrand = new Map<string, Product>();

            const registerKey = (
                map: Map<string, Product>,
                key: string,
                product: Product,
                label: string,
            ) => {
                const current = map.get(key);
                if (current && current.id !== product.id) {
                    report.conflicts.push(
                        `Duplicate existing ${label}: ${key}`,
                    );
                    return;
                }
                map.set(key, product);
            };
            const registerProduct = (product: Product) => {
                if (product.barcode) {
                    registerKey(
                        byBarcode,
                        makeBarcodeKey(product.barcode),
                        product,
                        'barcode',
                    );
                }
                if (product.sku) {
                    registerKey(
                        bySkuName,
                        makeSkuNameKey(product.sku, product.name),
                        product,
                        'SKU/name',
                    );
                }
                registerKey(
                    byNameBrand,
                    makeNameBrandKey(product.name, product.brand),
                    product,
                    'name/brand',
                );
            };
            existingProducts.forEach(registerProduct);

            if (apply && report.conflicts.length > 0) {
                throw new Error(
                    `Import blocked by conflicts:\n${report.conflicts.join('\n')}`,
                );
            }

            const findExisting = (parsed: ParsedProduct): Product | null => {
                if (parsed.barcode) {
                    const barcodeMatch = byBarcode.get(
                        makeBarcodeKey(parsed.barcode),
                    );
                    if (barcodeMatch) return barcodeMatch;
                    if (parsed.sku) {
                        return (
                            bySkuName.get(
                                makeSkuNameKey(parsed.sku, parsed.name),
                            ) ?? null
                        );
                    }
                    return null;
                }
                if (parsed.sku) {
                    return (
                        bySkuName.get(
                            makeSkuNameKey(parsed.sku, parsed.name),
                        ) ?? null
                    );
                }
                return (
                    byNameBrand.get(
                        makeNameBrandKey(parsed.name, parsed.brand),
                    ) ?? null
                );
            };

            for (const parsed of products) {
                const existing = findExisting(parsed);
                if (existing) {
                    const values = {
                        name: parsed.name,
                        brand: parsed.brand,
                        description: parsed.description,
                        sku: parsed.sku,
                        barcode: parsed.barcode,
                        productType: parsed.productType,
                        unitPrice: parsed.unitPrice,
                        vatRate: parsed.vatRate,
                        purchasePrice: parsed.purchasePrice,
                        ...(replaceStock ? { stock: parsed.stock } : {}),
                        minQuantity: parsed.minQuantity,
                        unit: parsed.unit,
                        isActive: parsed.isActive,
                        trackStock: parsed.trackStock,
                    };
                    const changes = hasImportChanges(
                        existing as unknown as Record<string, unknown>,
                        values,
                    );
                    if (changes) report.productsUpdate += 1;
                    else report.productsSkip += 1;
                    if (replaceStock) report.stockReplace += 1;
                    else report.stockPreserve += 1;
                    if (apply && changes) {
                        await productRepo.update(existing.id, values);
                    }
                    continue;
                }

                report.productsCreate += 1;
                if (!apply) continue;
                await productRepo.save(
                    productRepo.create({
                        name: parsed.name,
                        brand: parsed.brand,
                        description: parsed.description,
                        sku: parsed.sku,
                        barcode: parsed.barcode,
                        productType: parsed.productType,
                        unitPrice: parsed.unitPrice,
                        vatRate: parsed.vatRate,
                        purchasePrice: parsed.purchasePrice,
                        stock: parsed.stock,
                        minQuantity: parsed.minQuantity,
                        unit: parsed.unit,
                        isActive: parsed.isActive,
                        trackStock: parsed.trackStock,
                    }),
                );
            }

            if (apply && report.conflicts.length > 0) {
                throw new Error(
                    `Import blocked by conflicts:\n${report.conflicts.join('\n')}`,
                );
            }
        });
    } finally {
        await dataSource.destroy();
    }

    console.log(`Product import ${report.mode}: ${JSON.stringify(report)}`);
    console.log(
        `Rows skipped. Sections: ${skippedSectionRows}, repeated headers: ${skippedHeaderRows}, invalid: ${skippedInvalidRows}`,
    );
    if (report.conflicts.length > 0) {
        throw new Error(
            `Import blocked by conflicts:\n${report.conflicts.join('\n')}`,
        );
    }
    if (!apply) {
        console.log(
            'No DB changes. Set IMPORT_PRODUCTS_APPLY=1 only after reviewing this plan and taking a backup.',
        );
    }
}

run().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
});
