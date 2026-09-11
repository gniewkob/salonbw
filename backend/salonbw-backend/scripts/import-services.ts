import 'reflect-metadata';
import { DataSource, IsNull, In } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'node:fs/promises';
import {
    Service,
    PriceType as ServicePriceType,
} from '../src/services/service.entity';
import { ServiceCategory } from '../src/services/entities/service-category.entity';
import {
    ServiceVariant,
    PriceType as VariantPriceType,
} from '../src/services/entities/service-variant.entity';
import {
    buildVariantSyncPlan,
    hasImportChanges,
} from '../src/import/import-planning';

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
        const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
        if (!cleaned) return null;
        const num = Number(cleaned);
        return Number.isNaN(num) ? null : num;
    }
    return null;
}

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
        process.env.IMPORT_SERVICES_CSV ||
        path.resolve(__dirname, '..', '..', '..', 'uslugi.csv');
    const csvRaw = await fs.readFile(csvPath, 'utf8');
    return parseCsvRows(csvRaw);
}

async function run() {
    const rows = await loadRows();

    const servicesMap = new Map<string, ParsedService>();
    let currentCategory: string | null = null;
    let sortOrder = 0;

    const parseConflicts: string[] = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex] ?? [];
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

        if (
            price === null ||
            price < 0 ||
            duration === null ||
            duration <= 0 ||
            !Number.isInteger(duration)
        ) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): price must be non-negative and duration a positive whole number.`,
            );
            continue;
        }
        if (maxPrice !== null && maxPrice < price) {
            parseConflicts.push(
                `Row ${rowIndex + 1} (${name}): maximum price is lower than base price.`,
            );
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
        parseConflicts.push(
            ...buildVariantSyncPlan([], service.variants).conflicts.map(
                (conflict) => `${service.name}: ${conflict}`,
            ),
        );
    }

    const parseOnly = process.env.IMPORT_SERVICES_PARSE_ONLY === '1';
    if (parseOnly) {
        console.log(
            `Parse-only finished. Parsed services: ${servicesMap.size}. No DB connection or changes.`,
        );
        if (parseConflicts.length > 0) {
            throw new Error(
                `Import blocked by conflicts:\n${parseConflicts.join('\n')}`,
            );
        }
        return;
    }

    if (
        process.env.IMPORT_SERVICES_APPLY === '1' &&
        process.env.IMPORT_SERVICES_DRY_RUN === '1'
    ) {
        throw new Error(
            'IMPORT_SERVICES_APPLY and IMPORT_SERVICES_DRY_RUN cannot both be enabled.',
        );
    }
    const apply = process.env.IMPORT_SERVICES_APPLY === '1';
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

    await dataSource.initialize();

    const report = {
        mode: apply ? 'apply' : 'plan',
        categoriesCreate: 0,
        servicesCreate: 0,
        servicesUpdate: 0,
        servicesSkip: 0,
        variantsCreate: 0,
        variantsUpdate: 0,
        variantsSkip: 0,
        variantsDeactivate: 0,
        conflicts: [...parseConflicts],
    };

    try {
        await dataSource.transaction(async (manager) => {
            const categoryRepo = manager.getRepository(ServiceCategory);
            const serviceRepo = manager.getRepository(Service);
            const variantRepo = manager.getRepository(ServiceVariant);
            const uniqueCategoryNames = new Set<string>();
            for (const service of servicesMap.values()) {
                if (service.categoryName) {
                    uniqueCategoryNames.add(service.categoryName);
                }
            }

            const categoryNames = Array.from(uniqueCategoryNames);
            const categoriesMap = new Map<string, ServiceCategory>();
            if (categoryNames.length > 0) {
                const existingCategories = await categoryRepo.find({
                    where: { name: In(categoryNames) },
                });
                existingCategories.forEach((category) =>
                    categoriesMap.set(category.name, category),
                );
            }

            const missingCategoryNames = categoryNames.filter(
                (name) => !categoriesMap.has(name),
            );
            report.categoriesCreate = missingCategoryNames.length;
            if (apply && missingCategoryNames.length > 0) {
                const saved = await categoryRepo.save(
                    missingCategoryNames.map((name) =>
                        categoryRepo.create({
                            name,
                            sortOrder: 0,
                            isActive: true,
                        }),
                    ),
                );
                saved.forEach((category) =>
                    categoriesMap.set(category.name, category),
                );
            }

            for (const service of servicesMap.values()) {
                const category = service.categoryName
                    ? (categoriesMap.get(service.categoryName) ?? null)
                    : null;
                const existing =
                    service.categoryName && !category
                        ? null
                        : await serviceRepo.findOne({
                              where: {
                                  name: service.name,
                                  categoryId: category ? category.id : IsNull(),
                              },
                              relations: ['variants'],
                          });

                if (!existing) {
                    report.servicesCreate += 1;
                    report.variantsCreate += service.variants.length;
                    if (!apply) continue;

                    const saved = await serviceRepo.save(
                        serviceRepo.create({
                            name: service.name,
                            description: service.description ?? service.name,
                            publicDescription:
                                service.publicDescription ?? undefined,
                            privateDescription: undefined,
                            duration: service.duration,
                            price: service.price,
                            priceType: service.priceType,
                            vatRate: service.vatRate,
                            isFeatured: service.isFeatured,
                            isActive: service.isActive,
                            onlineBooking: service.onlineBooking,
                            sortOrder: service.sortOrder,
                            categoryId: category?.id,
                        } as Partial<Service>),
                    );
                    if (service.variants.length > 0) {
                        await variantRepo.save(
                            service.variants.map((variant) =>
                                variantRepo.create({
                                    ...variant,
                                    description:
                                        variant.description ?? undefined,
                                    serviceId: saved.id,
                                    priceType:
                                        variant.priceType as VariantPriceType,
                                    isActive: true,
                                } as Partial<ServiceVariant>),
                            ),
                        );
                    }
                    continue;
                }

                const variantPlan = buildVariantSyncPlan(
                    existing.variants ?? [],
                    service.variants,
                );
                report.variantsCreate += variantPlan.upserts.filter(
                    (item) => item.action === 'create',
                ).length;
                report.variantsDeactivate += variantPlan.deactivateIds.length;
                report.conflicts.push(
                    ...variantPlan.conflicts.map(
                        (conflict) => `${service.name}: ${conflict}`,
                    ),
                );

                const serviceValues = {
                    description:
                        service.description ??
                        existing.description ??
                        service.name,
                    publicDescription: service.publicDescription ?? undefined,
                    privateDescription: undefined,
                    duration: service.duration,
                    price: service.price,
                    priceType: service.priceType,
                    vatRate: service.vatRate,
                    isFeatured: service.isFeatured,
                    isActive: service.isActive,
                    onlineBooking: service.onlineBooking,
                    sortOrder: existing.sortOrder,
                    categoryId: category?.id,
                };
                const serviceChanges = hasImportChanges(
                    existing as unknown as Record<string, unknown>,
                    serviceValues,
                );
                if (serviceChanges) report.servicesUpdate += 1;
                else report.servicesSkip += 1;

                const existingVariantsById = new Map(
                    (existing.variants ?? []).map((variant) => [
                        variant.id,
                        variant,
                    ]),
                );
                const plannedVariants = variantPlan.upserts.map((item) => {
                    const values = {
                        ...item.incoming,
                        description: item.incoming.description ?? undefined,
                        serviceId: existing.id,
                        priceType: item.incoming.priceType as VariantPriceType,
                        isActive: true,
                    };
                    const changes =
                        item.action === 'create' ||
                        hasImportChanges(
                            (existingVariantsById.get(item.existingId!) ??
                                {}) as unknown as Record<string, unknown>,
                            values,
                        );
                    if (item.action === 'update' && changes) {
                        report.variantsUpdate += 1;
                    } else if (item.action === 'update') {
                        report.variantsSkip += 1;
                    }
                    return { ...item, values, changes };
                });

                if (!apply || variantPlan.conflicts.length > 0) continue;
                if (serviceChanges) {
                    await serviceRepo.update(existing.id, serviceValues);
                }

                for (const item of plannedVariants) {
                    if (item.action === 'update') {
                        if (item.changes) {
                            await variantRepo.update(
                                item.existingId!,
                                item.values,
                            );
                        }
                    } else {
                        await variantRepo.save(
                            variantRepo.create(
                                item.values as Partial<ServiceVariant>,
                            ),
                        );
                    }
                }
                if (variantPlan.deactivateIds.length > 0) {
                    await variantRepo.update(
                        { id: In(variantPlan.deactivateIds) },
                        { isActive: false },
                    );
                }
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

    console.log(`Service import ${report.mode}: ${JSON.stringify(report)}`);
    if (report.conflicts.length > 0) {
        throw new Error(
            `Import blocked by conflicts:\n${report.conflicts.join('\n')}`,
        );
    }
    if (!apply) {
        console.log(
            'No DB changes. Set IMPORT_SERVICES_APPLY=1 only after reviewing this plan and taking a backup.',
        );
    }
}

run().catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
});
