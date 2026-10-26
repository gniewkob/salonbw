import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import { open, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

// No row values, identifiers or raw database errors leave this process.
type Edge = {
    child: string;
    column: string;
    parent: string;
    parentColumn: string;
    width: number;
};
type Schema = { tables: string[]; edges: Edge[] };
type Selection = Map<string, Set<string>>;
const q = (name: string) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name))
        throw Error('Unsafe schema identifier');
    return `"${name}"`;
};
const hash = (value: unknown) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex');
const TEST_CLIENT = `role = 'client' AND (email LIKE 'synthetic.client.%@example.invalid' OR (email ~* '@(example[.]invalid|example[.]test|salonbw[.]example[.]test)$' AND name ~* '(^SYNTHETIC |^UAT |testow|^E2E)'))`;
const ROOTS: Record<string, string> = {
    // Derived cache is disposable and must not retain deleted fixture summaries.
    'query-result-cache': 'TRUE',
    users: TEST_CLIENT,
    appointments: `"clientId" IN (SELECT id FROM users WHERE ${TEST_CLIENT})`,
    products: `sku LIKE 'SYNTH-%'`,
    product_categories: `name LIKE 'SYNTHETIC %'`,
    suppliers: `name LIKE 'SYNTHETIC %'`,
    customer_groups: `name LIKE 'SYNTHETIC %'`,
    customer_tags: `name LIKE 'SYNTHETIC %'`,
    customer_origins: `name LIKE 'SYNTHETIC %'`,
    deliveries: `"deliveryNumber" LIKE 'SYNTHETIC-%'`,
    warehouse_orders: `"orderNumber" LIKE 'SYNTHETIC-%'`,
    warehouse_sales: `"saleNumber" LIKE 'SYNTHETIC-%'`,
    warehouse_usages: `"usageNumber" LIKE 'SYNTHETIC-%'`,
    stocktakings: `"stocktakingNumber" LIKE 'SYNTHETIC-%'`,
};

export async function schema(runner: QueryRunner): Promise<Schema> {
    const tables = (await runner.query(
        `SELECT tablename AS name FROM pg_tables WHERE schemaname='public' ORDER BY tablename`,
    )) as Array<{ name: string }>;
    const edges =
        (await runner.query(`SELECT c.relname AS child, ca.attname AS column, p.relname AS parent, pa.attname AS "parentColumn", cardinality(k.conkey) AS width
        FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace cn ON cn.oid=c.relnamespace
        JOIN pg_class p ON p.oid=k.confrelid JOIN pg_namespace pn ON pn.oid=p.relnamespace
        JOIN pg_attribute ca ON ca.attrelid=c.oid AND ca.attnum=k.conkey[1]
        JOIN pg_attribute pa ON pa.attrelid=p.oid AND pa.attnum=k.confkey[1]
        WHERE k.contype='f' AND cn.nspname='public' AND pn.nspname='public' ORDER BY c.relname,ca.attname`)) as Edge[];
    if (
        edges.some((e) => e.width !== 1) ||
        !['users', 'appointments', 'import_source_links'].every((t) =>
            tables.some((x) => x.name === t),
        )
    )
        throw Error('Unsupported schema');
    return { tables: tables.map((t) => t.name), edges };
}

export async function selectTargets(
    runner: QueryRunner,
    structure: Schema,
): Promise<Selection> {
    const selected: Selection = new Map(
        structure.tables.map((t) => [t, new Set<string>()]),
    );
    const roots = new Map<string, Set<string>>();
    for (const [table, where] of Object.entries(ROOTS)) {
        if (!selected.has(table)) continue;
        const rows = (await runner.query(
            `SELECT ctid::text AS rid FROM ${q(table)} WHERE ${where}`,
        )) as Array<{ rid: string }>;
        roots.set(table, new Set(rows.map((r) => r.rid)));
        selected.set(table, new Set(rows.map((r) => r.rid)));
    }
    for (let pass = 0; pass <= structure.tables.length; pass++) {
        let changed = false;
        for (const e of structure.edges) {
            const parents = [...selected.get(e.parent)!];
            if (!parents.length) continue;
            const rows = (await runner.query(
                `SELECT c.ctid::text AS rid FROM ${q(e.child)} c JOIN ${q(e.parent)} p ON c.${q(e.column)}=p.${q(e.parentColumn)} WHERE p.ctid=ANY($1::tid[])`,
                [parents],
            )) as Array<{ rid: string }>;
            for (const { rid } of rows)
                if (!selected.get(e.child)!.has(rid)) {
                    selected.get(e.child)!.add(rid);
                    changed = true;
                }
        }
        if (!changed) break;
        if (pass === structure.tables.length)
            throw Error('Unbounded dependency closure');
    }
    // Never widen a marker-based business root through a foreign-key cascade.
    for (const [table, allowed] of roots)
        if ([...selected.get(table)!].some((rid) => !allowed.has(rid)))
            throw Error('Mixed real/synthetic dependency');
    for (const [table, entity] of [
        ['users', 'client'],
        ['appointments', 'appointment'],
        ['reviews', 'review'],
    ]) {
        const ids = [...(selected.get(table) || [])];
        if (!ids.length) continue;
        const rows = (await runner.query(
            `SELECT count(*)::int AS n FROM ${q(table)} t JOIN import_source_links l ON l."localId"=t.id AND l.entity=$2 WHERE t.ctid=ANY($1::tid[])`,
            [ids, entity],
        )) as Array<{ n: number }>;
        if (rows[0].n) throw Error('Imported record selected');
    }
    // Files need a separate, reviewed storage manifest before removing metadata.
    if (
        ['customer_files', 'customer_gallery_images'].some(
            (t) => selected.get(t)?.size,
        )
    )
        throw Error('Private file cleanup needs a storage manifest');
    for (const e of structure.edges.filter(
        (e) => e.parent === 'appointments',
    )) {
        const ids = [...selected.get(e.child)!];
        if (!ids.length) continue;
        const rows = (await runner.query(
            `SELECT count(*)::int AS n FROM ${q(e.child)} c JOIN appointments p ON c.${q(e.column)}=p.${q(e.parentColumn)} WHERE c.ctid=ANY($1::tid[]) AND NOT(p.ctid=ANY($2::tid[]))`,
            [ids, [...selected.get('appointments')!]],
        )) as Array<{ n: number }>;
        if (rows[0].n)
            throw Error('Selected child belongs to a retained appointment');
    }
    return selected;
}

export async function retained(
    runner: QueryRunner,
    structure: Schema,
    selected: Selection,
) {
    const result: Record<string, { n: number; digest: string }> = {};
    for (const table of structure.tables) {
        const rows = (await runner.query(
            `SELECT count(*)::int AS n, md5(COALESCE(string_agg(md5(row_to_json(t)::text), '' ORDER BY t.ctid),'')) AS digest FROM ${q(table)} t WHERE NOT(t.ctid=ANY($1::tid[]))`,
            [[...selected.get(table)!]],
        )) as Array<{ n: number; digest: string }>;
        result[table] = rows[0];
    }
    return result;
}
export function deletionOrder(
    structure: Schema,
    selected: Selection,
): string[] {
    const pending = new Set(
        [...selected].filter(([, ids]) => ids.size).map(([t]) => t),
    );
    const order: string[] = [];
    while (pending.size) {
        const next = [...pending]
            .sort()
            .find(
                (t) =>
                    !structure.edges.some(
                        (e) =>
                            e.parent === t &&
                            e.child !== t &&
                            pending.has(e.child),
                    ),
            );
        if (!next) throw Error('Cyclic deletion dependency');
        order.push(next);
        pending.delete(next);
    }
    return order;
}
export async function plan(runner: QueryRunner) {
    const structure = await schema(runner);
    const selected = await selectTargets(runner, structure);
    const preserved = await retained(runner, structure, selected);
    const counts = Object.fromEntries(
        [...selected]
            .filter(([, ids]) => ids.size)
            .map(([t, ids]) => [t, ids.size]),
    );
    const digest = hash({
        structure,
        selected: [...selected].map(([t, ids]) => [t, [...ids].sort()]),
        preserved,
    });
    return {
        structure,
        selected,
        preserved,
        counts,
        digest,
        order: deletionOrder(structure, selected),
    };
}
export async function verifyBackup(file: string, databaseName: string) {
    const metadata = await lstat(file);
    if (
        !metadata.isFile() ||
        metadata.mode & 0o077 ||
        metadata.size < 5 ||
        Date.now() - metadata.mtimeMs > 30 * 60000 ||
        metadata.mtimeMs > Date.now()
    )
        throw Error('Invalid private backup');
    const handle = await open(file, 'r');
    try {
        const bytes = Buffer.alloc(5);
        await handle.read(bytes, 0, 5, 0);
        if (bytes.toString() !== 'PGDMP') throw Error('Invalid dump format');
    } finally {
        await handle.close();
    }
    const listed = spawnSync('pg_restore', ['--list', file], {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
    });
    const backupDatabase = /^;\s+dbname:\s+(.+)$/m
        .exec(listed.stdout)?.[1]
        .trim();
    if (
        listed.status !== 0 ||
        !listed.stdout.includes('TABLE DATA') ||
        backupDatabase !== databaseName
    )
        throw Error('Backup inventory rejected');
}
export async function execute(runner: QueryRunner, expectedDigest: string) {
    const structure = await schema(runner);
    await runner.query(
        `LOCK TABLE ${structure.tables.map(q).join(',')} IN SHARE ROW EXCLUSIVE MODE`,
    );
    const current = await plan(runner);
    if (current.digest !== expectedDigest) throw Error('Plan changed');
    const deleted: Record<string, number> = {};
    for (const table of current.order) {
        const rows = (await runner.query(
            `WITH removed AS (DELETE FROM ${q(table)} WHERE ctid=ANY($1::tid[]) RETURNING 1) SELECT count(*)::int AS n FROM removed`,
            [[...current.selected.get(table)!]],
        )) as Array<{ n: number }>;
        if (rows[0].n !== current.counts[table])
            throw Error('Deletion count changed');
        deleted[table] = rows[0].n;
    }
    const empty: Selection = new Map(
        current.structure.tables.map((t) => [t, new Set<string>()]),
    );
    if (
        hash(await retained(runner, current.structure, empty)) !==
        hash(current.preserved)
    )
        throw Error('Retained data changed');
    const remaining = await selectTargets(runner, current.structure);
    if ([...remaining.values()].some((ids) => ids.size))
        throw Error('Synthetic markers remain');
    return { deleted, retainedDataUnchanged: true, importLinksUnchanged: true };
}
export async function main() {
    config({ quiet: true });
    const apply = process.argv[2] === 'apply';
    if (!apply && process.argv[2] !== 'plan') throw Error('Use plan or apply');
    if (apply && process.env.APP_ENV !== 'production')
        throw Error(
            'Production cleanup requires an explicit production environment',
        );
    if (apply) {
        if (
            process.env.SYNTHETIC_CLEANUP_CONFIRM !==
                'REMOVE_MARKED_SYNTHETIC_ONLY' ||
            !process.env.SYNTHETIC_CLEANUP_PLAN ||
            !process.env.SYNTHETIC_CLEANUP_BACKUP
        )
            throw Error('Write guards missing');
        const databaseName = decodeURIComponent(
            new URL(process.env.DATABASE_URL!).pathname.slice(1),
        );
        await verifyBackup(process.env.SYNTHETIC_CLEANUP_BACKUP, databaseName);
    }
    const db = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        logging: false,
        synchronize: false,
    });
    await db.initialize();
    const runner = db.createQueryRunner();
    await runner.connect();
    try {
        await runner.query(
            apply
                ? 'BEGIN ISOLATION LEVEL SERIALIZABLE'
                : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
        );
        await runner.query("SET LOCAL lock_timeout='3s'");
        await runner.query("SET LOCAL statement_timeout='30s'");
        const report = apply
            ? await execute(runner, process.env.SYNTHETIC_CLEANUP_PLAN!)
            : await plan(runner);
        await runner.query(apply ? 'COMMIT' : 'ROLLBACK');
        console.log(
            JSON.stringify(
                apply
                    ? { mode: 'apply', ...report }
                    : {
                          mode: 'plan',
                          counts: (report as Awaited<ReturnType<typeof plan>>)
                              .counts,
                          planSha256: (
                              report as Awaited<ReturnType<typeof plan>>
                          ).digest,
                      },
                null,
                2,
            ),
        );
    } catch {
        await runner.query('ROLLBACK');
        throw Error(
            'Cleanup did not report success; verify the outcome with a fresh plan',
        );
    } finally {
        await runner.release();
        await db.destroy();
    }
}
if (require.main === module)
    main().catch(() => {
        console.error(
            'Synthetic cleanup failed; verify the outcome with a fresh plan; private details withheld.',
        );
        process.exitCode = 1;
    });
