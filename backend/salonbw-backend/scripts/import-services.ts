import 'reflect-metadata';
import { DataSource, IsNull } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import { Service, PriceType as ServicePriceType } from '../src/services/service.entity';
import { ServiceCategory } from '../src/services/entities/service-category.entity';
import { ServiceVariant, PriceType as VariantPriceType } from '../src/services/entities/service-variant.entity';

loadEnv();

type RawRow = Array<unknown>;

type ParsedVariant = {
    name: string;
    description?: string | null;
    duration: number;
    price: number;
    priceType: ServicePriceType;
    sortOrder: number;
};

type ParsedService = {
    name: string;
    description?: string | null;
    publicDescription?: string | null;
    duration: number;
    price: number;
    priceType: ServicePriceType;
    vatRate: number;
    isFeatured: boolean;
    isActive: boolean;
    onlineBooking: boolean;
    sortOrder: number;
    categoryName?: string | null;
    variants: ParsedVariant[];
};

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '');
        if (!cleaned) return null;
        const num = Number(cleaned);
        return Number.isNaN(num) ? null : num;
    }
    return null;
}

function normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text ? text : null;
}

function isHeaderRow(row: RawRow): boolean {
    return (
        typeof row[0] === 'string' &&
        String(row[0]).toLowerCase().includes('usługa')
    );
}

function isCategoryRow(row: RawRow): boolean {
    const name = normalizeText(row[0]);
    if (!name) return false;
    const restEmpty =
        !normalizeText(row[1]) &&
        !normalizeText(row[2]) &&
        !normalizeText(row[3]) &&
        !normalizeText(row[4]);
    return restEmpty;
}

function splitServiceName(name: string): { base: string; variant?: string } {
    const parts = name.split(' - ');
    if (parts.length <= 1) {
        return { base: name.trim() };
    }
    const base = parts.shift()!.trim();
    const variant = parts.join(' - ').trim();
    return variant ? { base, variant } : { base };
}

async function run() {
    const workbookPath =
        process.env.IMPORT_SERVICES_XLSX ||
        path.resolve(__dirname, '..', '..', '..', 'uslugi.xlsx');

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

    const servicesMap = new Map<string, ParsedService>();
    let currentCategory: string | null = null;
    let sortOrder = 0;

    for (const row of rows) {
        if (!row || row.length === 0) continue;

        if (isHeaderRow(row)) continue;

        if (isCategoryRow(row)) {
            currentCategory = normalizeText(row[0]);
            continue;
        }

        const name = normalizeText(row[0]);
        if (!name) continue;

        const price = parseNumber(row[1]);
        const maxPrice = parseNumber(row[2]);
        const duration = parseNumber(row[3]);
        const description = normalizeText(row[4]);

        if (price === null || duration === null) {
            continue;
        }

        const { base, variant } = splitServiceName(name);
        const key = `${currentCategory ?? 'Bez kategorii'}::${base}`;

        const priceType: ServicePriceType =
            maxPrice !== null && maxPrice > price
                ? ServicePriceType.From
                : ServicePriceType.Fixed;

        if (!servicesMap.has(key)) {
            servicesMap.set(key, {
                name: base,
                description: description ?? null,
                publicDescription: description ?? null,
                duration,
                price,
                priceType,
                vatRate: 23,
                isFeatured: false,
                isActive: true,
                onlineBooking: true,
                sortOrder,
                categoryName: currentCategory,
                variants: [],
            });
            sortOrder += 1;
        }

        const service = servicesMap.get(key)!;
        if (description && !service.publicDescription) {
            service.publicDescription = description;
        }
        if (description && !service.description) {
            service.description = description;
        }

        if (variant) {
            service.variants.push({
                name: variant,
                description: description ?? null,
                duration,
                price,
                priceType,
                sortOrder: service.variants.length,
            });
        } else {
            service.duration = duration;
            service.price = price;
            service.priceType = priceType;
        }
    }

    for (const service of servicesMap.values()) {
        if (service.variants.length > 0) {
            service.variants.sort((a, b) => a.sortOrder - b.sortOrder);
            const minPrice = Math.min(...service.variants.map((v) => v.price));
            const maxPrice = Math.max(...service.variants.map((v) => v.price));
            const minDuration = Math.min(
                ...service.variants.map((v) => v.duration),
            );
            service.price = minPrice;
            service.duration = minDuration;
            service.priceType =
                maxPrice > minPrice ? ServicePriceType.From : service.priceType;
        }
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

    const categoryRepo = dataSource.getRepository(ServiceCategory);
    const serviceRepo = dataSource.getRepository(Service);
    const variantRepo = dataSource.getRepository(ServiceVariant);

    let created = 0;
    let updated = 0;

    for (const service of servicesMap.values()) {
        let category: ServiceCategory | null = null;
        if (service.categoryName) {
            category = await categoryRepo.findOne({
                where: { name: service.categoryName },
            });
            if (!category) {
                category = categoryRepo.create({
                    name: service.categoryName,
                    sortOrder: 0,
                    isActive: true,
                });
                category = await categoryRepo.save(category);
            }
        }

        const existing = await serviceRepo.findOne({
            where: {
                name: service.name,
                categoryId: category ? category.id : IsNull(),
            },
            relations: ['variants'],
        });

        if (existing) {
            await serviceRepo.update(existing.id, {
                description:
                    service.description ?? existing.description ?? service.name,
                publicDescription: service.publicDescription ?? undefined,
                privateDescription: undefined,
                duration: service.duration,
                price: service.price,
                priceType: service.priceType as ServicePriceType,
                vatRate: service.vatRate,
                isFeatured: service.isFeatured,
                isActive: service.isActive,
                onlineBooking: service.onlineBooking,
                sortOrder: existing.sortOrder,
                categoryId: category?.id ?? undefined,
            });

            await variantRepo.delete({ serviceId: existing.id });
            if (service.variants.length > 0) {
                const variants = service.variants.map((v) =>
                    variantRepo.create({
                        serviceId: existing.id,
                        name: v.name,
                        description: v.description ?? undefined,
                        duration: v.duration,
                        price: v.price,
                        priceType: v.priceType as VariantPriceType,
                        sortOrder: v.sortOrder,
                        isActive: true,
                    } as Partial<ServiceVariant>),
                );
                await variantRepo.save(variants);
            }
            updated += 1;
        } else {
            const createdService = serviceRepo.create({
                name: service.name,
                description: service.description ?? service.name,
                publicDescription: service.publicDescription ?? undefined,
                privateDescription: undefined,
                duration: service.duration,
                price: service.price,
                priceType: service.priceType as ServicePriceType,
                vatRate: service.vatRate,
                isFeatured: service.isFeatured,
                isActive: service.isActive,
                onlineBooking: service.onlineBooking,
                sortOrder: service.sortOrder,
                categoryId: category?.id ?? undefined,
            } as Partial<Service>);
            const saved = await serviceRepo.save(createdService);

            if (service.variants.length > 0) {
                const variants = service.variants.map((v) =>
                    variantRepo.create({
                        serviceId: saved.id,
                        name: v.name,
                        description: v.description ?? undefined,
                        duration: v.duration,
                        price: v.price,
                        priceType: v.priceType as VariantPriceType,
                        sortOrder: v.sortOrder,
                        isActive: true,
                    } as Partial<ServiceVariant>),
                );
                await variantRepo.save(variants);
            }
            created += 1;
        }
    }

    await dataSource.destroy();
    console.log(
        `Import finished. Created: ${created}, updated: ${updated}, total: ${servicesMap.size}`,
    );
}

run().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
});
