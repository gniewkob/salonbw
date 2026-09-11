export interface ExistingVariantIdentity {
    id: number;
    name: string;
    isActive: boolean;
}

export interface IncomingVariantIdentity {
    name: string;
}

export interface VariantUpsert<TIncoming> {
    action: 'create' | 'update';
    existingId?: number;
    incoming: TIncoming;
}

export interface VariantSyncPlan<TIncoming> {
    upserts: VariantUpsert<TIncoming>[];
    deactivateIds: number[];
    conflicts: string[];
}

function identity(value: string): string {
    return value.trim().toLocaleLowerCase('pl-PL');
}

export function buildVariantSyncPlan<TIncoming extends IncomingVariantIdentity>(
    existing: ExistingVariantIdentity[],
    incoming: TIncoming[],
): VariantSyncPlan<TIncoming> {
    const conflicts: string[] = [];
    const existingByIdentity = new Map<string, ExistingVariantIdentity>();
    const duplicateExisting = new Set<string>();

    for (const variant of existing) {
        const key = identity(variant.name);
        if (existingByIdentity.has(key)) duplicateExisting.add(key);
        existingByIdentity.set(key, variant);
    }

    for (const key of duplicateExisting) {
        conflicts.push(`Duplicate existing variant identity: ${key}`);
    }

    const seenIncoming = new Set<string>();
    const matchedExistingIds = new Set<number>();
    const upserts: VariantUpsert<TIncoming>[] = [];

    for (const variant of incoming) {
        const key = identity(variant.name);
        if (seenIncoming.has(key)) {
            conflicts.push(`Duplicate incoming variant identity: ${key}`);
            continue;
        }
        seenIncoming.add(key);

        const match = existingByIdentity.get(key);
        if (match && !duplicateExisting.has(key)) {
            matchedExistingIds.add(match.id);
            upserts.push({
                action: 'update',
                existingId: match.id,
                incoming: variant,
            });
        } else if (!duplicateExisting.has(key)) {
            upserts.push({ action: 'create', incoming: variant });
        }
    }

    return {
        upserts,
        deactivateIds: existing
            .filter(
                (variant) =>
                    variant.isActive && !matchedExistingIds.has(variant.id),
            )
            .map((variant) => variant.id),
        conflicts,
    };
}

export function resolveStockUnits(
    stockUnits: number | null,
    stockPackages: number | null,
): { value: number | null; conflict?: string } {
    if (stockUnits === null) {
        if (stockPackages !== null && stockPackages !== 0) {
            return {
                value: null,
                conflict:
                    'Package stock requires an explicit usage-unit value.',
            };
        }
        return { value: 0 };
    }

    if (!Number.isInteger(stockUnits)) {
        return {
            value: null,
            conflict: 'Usage-unit stock must be a whole number.',
        };
    }

    if (stockUnits < 0) {
        return {
            value: null,
            conflict: 'Usage-unit stock cannot be negative.',
        };
    }

    return { value: stockUnits };
}

export function hasImportChanges(
    current: Record<string, unknown>,
    next: Record<string, unknown>,
): boolean {
    return Object.entries(next).some(([key, nextValue]) => {
        if (nextValue === undefined) return false;
        const currentValue = current[key];
        if (currentValue == null && nextValue == null) return false;
        if (typeof currentValue === 'number' || typeof nextValue === 'number') {
            return Number(currentValue) !== Number(nextValue);
        }
        return currentValue !== nextValue;
    });
}
