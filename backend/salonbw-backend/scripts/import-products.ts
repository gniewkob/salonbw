import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import { Product, ProductType } from '../src/products/product.entity';

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
    const text = String(value).trim();
    return text || null;
}

function truncate(value: string | null, maxLength: number): string | null {
    if (!value) return null;
    return value.length > maxLength ? value.slice(0, maxLength) : value;
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
    return first === HEADER_PRODUCT.toLowerCase() &&
        second === HEADER_PRODUCER.toLowerCase();
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

async function run() {
    const workbookPath =
        process.env.IMPORT_PRODUCTS_XLSX ||
        path.resolve(__dirname, '..', '..', '..', 'produkty.xlsx');

    const workbook = XLSX.readFile(workbookPath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('No sheets found in workbook.');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
        header: 1,
        defval: null,
        blankrows: false,
    });

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

    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
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

        const name = truncate(normalizeText(row[0]), 200);
        if (!name) {
            skippedInvalidRows += 1;
            continue;
        }

        const sectionBrand = normalizeSection(currentSection);
        const brand =
            truncate(normalizeText(row[1]), 100) ??
            truncate(sectionBrand, 100) ??
            'Nieznany producent';

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
            unitPrice = 0;
        }

        const stockUnits = parseNumber(row[7]);
        const stockPackages = parseNumber(row[6]);
        const stock = Math.max(
            0,
            Math.round(stockUnits ?? stockPackages ?? 0),
        );

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
            sku: truncate(normalizeCode(row[12]), 50),
            barcode: truncate(normalizeCode(row[13]), 50),
            productType: mapProductType(rawProductType),
            unitPrice: roundTo2(unitPrice),
            purchasePrice:
                purchasePriceRaw === null ? null : roundTo2(purchasePriceRaw),
            stock,
            unit: truncate(normalizeText(row[9]), 20),
            minQuantity: null,
            isActive: true,
            trackStock: true,
        };

        products.push(parsed);
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
        entities: [
            path.join(__dirname, '..', 'src', '**', '*.entity.{ts,js}'),
        ],
        ssl: process.env.PGSSL === '1' ? true : undefined,
    });

    await dataSource.initialize();
    const productRepo = dataSource.getRepository(Product);

    const existingProducts = await productRepo.find();
    const byBarcode = new Map<string, Product>();
    const bySkuName = new Map<string, Product>();
    const byNameBrand = new Map<string, Product>();

    const registerProduct = (product: Product) => {
        if (product.barcode) {
            byBarcode.set(makeBarcodeKey(product.barcode), product);
        }
        if (product.sku) {
            bySkuName.set(
                makeSkuNameKey(product.sku, product.name),
                product,
            );
        }
        byNameBrand.set(
            makeNameBrandKey(product.name, product.brand),
            product,
        );
    };

    existingProducts.forEach(registerProduct);

    const findExisting = (parsed: ParsedProduct): Product | null => {
        if (parsed.barcode) {
            const byBarcodeMatch = byBarcode.get(makeBarcodeKey(parsed.barcode));
            if (byBarcodeMatch) return byBarcodeMatch;

            if (parsed.sku) {
                const bySkuNameMatch = bySkuName.get(
                    makeSkuNameKey(parsed.sku, parsed.name),
                );
                if (bySkuNameMatch) return bySkuNameMatch;
            }

            return null;
        }

        if (parsed.sku) {
            const bySkuNameMatch = bySkuName.get(
                makeSkuNameKey(parsed.sku, parsed.name),
            );
            if (bySkuNameMatch) return bySkuNameMatch;
            return null;
        }

        return byNameBrand.get(makeNameBrandKey(parsed.name, parsed.brand)) ?? null;
    };

    let created = 0;
    let updated = 0;

    for (const parsed of products) {
        const existing = findExisting(parsed);

        if (existing) {
            await productRepo.update(existing.id, {
                name: parsed.name,
                brand: parsed.brand,
                description: parsed.description,
                sku: parsed.sku,
                barcode: parsed.barcode,
                productType: parsed.productType,
                unitPrice: parsed.unitPrice,
                purchasePrice: parsed.purchasePrice,
                stock: parsed.stock,
                minQuantity: parsed.minQuantity,
                unit: parsed.unit,
                isActive: parsed.isActive,
                trackStock: parsed.trackStock,
            });

            const refreshed = await productRepo.findOne({
                where: { id: existing.id },
            });
            if (refreshed) {
                registerProduct(refreshed);
            }
            updated += 1;
            continue;
        }

        const createdProduct = productRepo.create({
            name: parsed.name,
            brand: parsed.brand,
            description: parsed.description,
            sku: parsed.sku,
            barcode: parsed.barcode,
            productType: parsed.productType,
            unitPrice: parsed.unitPrice,
            purchasePrice: parsed.purchasePrice,
            stock: parsed.stock,
            minQuantity: parsed.minQuantity,
            unit: parsed.unit,
            isActive: parsed.isActive,
            trackStock: parsed.trackStock,
        });

        const saved = await productRepo.save(createdProduct);
        registerProduct(saved);
        created += 1;
    }

    await dataSource.destroy();

    console.log(
        `Import finished. Created: ${created}, updated: ${updated}, total: ${products.length}`,
    );
    console.log(
        `Rows skipped. Sections: ${skippedSectionRows}, repeated headers: ${skippedHeaderRows}, invalid: ${skippedInvalidRows}`,
    );
}

run().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
});
