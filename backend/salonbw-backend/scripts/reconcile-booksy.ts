import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Run on the data host. Never emit source rows, IDs, names, notes or DB errors.
type Row = Record<string, string>;
type Visit = {
    id: number;
    clientId: number;
    employeeId: number;
    serviceId: number;
    start: string;
    end: string;
    status: string;
};
type Link = { externalId: string; localId: number };
type Staff = { id: number; name: string; role: string; isSystemAdmin: boolean };
export type Snapshot = {
    now: string;
    visits: Visit[];
    visitLinks: Link[];
    clientLinks: Link[];
    staff: Staff[];
};
const ACTIVE = new Set([
    'scheduled',
    'confirmed',
    'in_progress',
    'online_pending',
    'rescheduled_pending',
]);
const STATUSES: Record<string, string> = {
    finished: 'completed',
    cancelled: 'cancelled',
    declined: 'cancelled',
    'no-show': 'no_show',
    noshow: 'no_show',
    no_show: 'no_show',
    confirmed: 'confirmed',
};
// Keep identical to staffKey in import-booksy.ts.
const staffKey = (s: string) =>
    s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl-PL');

export function parseCsv(input: string): Row[] {
    const records: string[][] = [];
    let record: string[] = [];
    let field = '';
    let quoted = false;
    let closed = false;
    const text = input.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') {
                quoted = false;
                closed = true;
            } else field += c;
        } else if (c === '"' && field === '' && !closed) quoted = true;
        else if (c === ',' || c === '\n' || c === '\r') {
            record.push(field);
            field = '';
            closed = false;
            if (c !== ',') {
                if (record.some(Boolean)) records.push(record);
                record = [];
                if (c === '\r' && text[i + 1] === '\n') i++;
            }
        } else {
            if (closed || c === '"') throw new Error('Invalid CSV');
            field += c;
        }
    }
    if (quoted) throw new Error('Invalid CSV');
    if (field || record.length || closed) {
        record.push(field);
        records.push(record);
    }
    const headers = records.shift();
    if (!headers || new Set(headers).size !== headers.length)
        throw new Error('Invalid CSV headers');
    const required = [
        'booking_id',
        'customer_card_id',
        'staffer',
        'booked_from',
        'booked_till',
        'status',
    ];
    if (required.some((h) => !headers.includes(h)))
        throw new Error('Missing appointment columns');
    return records.map((r) => {
        if (r.length !== headers.length) throw new Error('Invalid CSV row');
        return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
    });
}
function wallTime(value: string): string | null {
    if (!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d$/.test(value)) return null;
    const normalized = value.replace('T', ' ');
    const date = new Date(normalized.replace(' ', 'T') + 'Z');
    return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 19).replace('T', ' ') === normalized
        ? normalized
        : null;
}

export function reconcile(
    rows: Row[],
    db: Snapshot,
    staffMap: Record<string, number> = {},
) {
    const now = wallTime(db.now);
    if (!now) throw new Error('Invalid snapshot time');
    const report = {
        sourceRows: rows.length,
        duplicateSourceIds: 0,
        invalidRows: 0,
        unknownStatuses: 0,
        confirmedUpcoming: 0,
        confirmedElapsed: 0,
        anonymousUpcoming: 0,
        linkedUpcoming: 0,
        missingUpcoming: 0,
        missingClientLinks: 0,
        ambiguousStaff: 0,
        danglingVisitLinks: 0,
        linkedDrift: 0,
        nativeExactCandidates: 0,
        targetOverlapPairs: 0,
        sourceOverlapPairs: 0,
        targetActiveUpcoming: 0,
        linkedActiveAbsentFromSource: 0,
        readyForImport: false,
    };
    const aliases = new Map(
        Object.entries(staffMap).map(([name, id]) => [staffKey(name), id]),
    );
    const visitById = new Map(db.visits.map((v) => [v.id, v]));
    const visitLinks = new Map(
        db.visitLinks.map((l) => [l.externalId, l.localId]),
    );
    const clients = new Map(
        db.clientLinks.map((l) => [l.externalId, l.localId]),
    );
    const seen = new Set<string>();
    const sourceIds = new Set(rows.map((r) => r.booking_id.trim()));
    const sourceIntervals: Array<{
        start: string;
        end: string;
        employeeId: number;
    }> = [];
    for (const r of rows) {
        const id = r.booking_id.trim();
        if (seen.has(id)) report.duplicateSourceIds++;
        seen.add(id);
        const start = wallTime(r.booked_from);
        const end = wallTime(r.booked_till);
        const status = STATUSES[r.status.trim().toLowerCase()];
        if (!status) {
            report.unknownStatuses++;
            continue;
        }
        if (!id || !start || !end || end <= start) {
            report.invalidRows++;
            continue;
        }
        const localId = visitLinks.get(id);
        const local =
            localId === undefined ? undefined : visitById.get(localId);
        const clientId = clients.get(r.customer_card_id.trim());
        const mappedId = aliases.get(staffKey(r.staffer));
        const staff = db.staff.filter(
            (s) =>
                !s.isSystemAdmin &&
                ['admin', 'employee', 'receptionist'].includes(s.role) &&
                (mappedId !== undefined
                    ? s.id === mappedId
                    : staffKey(s.name) === staffKey(r.staffer)),
        );
        // Check cancellations/reschedules of linked future visits as well as new bookings.
        const relevant = end > now || (local !== undefined && local.end > now);
        if (localId !== undefined && !local) report.danglingVisitLinks++;
        if (
            local &&
            relevant &&
            (local.start !== start ||
                local.end !== end ||
                local.status !== status ||
                clientId !== local.clientId ||
                staff.length !== 1 ||
                staff[0].id !== local.employeeId)
        )
            report.linkedDrift++;
        if (status !== 'confirmed') continue;
        if (end <= now) {
            report.confirmedElapsed++;
            continue;
        }
        report.confirmedUpcoming++;
        if (
            ['', 'null', 'none'].includes(
                r.customer_card_id.trim().toLowerCase(),
            )
        )
            report.anonymousUpcoming++;
        // Source conflicts survive partial/full imports; target delta checks below
        // remain restricted to unlinked bookings.
        if (staff.length === 1)
            sourceIntervals.push({ start, end, employeeId: staff[0].id });
        if (localId !== undefined) {
            report.linkedUpcoming++;
            continue;
        }
        report.missingUpcoming++;
        if (clientId === undefined) report.missingClientLinks++;
        if (staff.length !== 1) {
            report.ambiguousStaff++;
            continue;
        }
        const employeeId = staff[0].id;
        for (const target of db.visits) {
            if (
                !ACTIVE.has(target.status) ||
                target.end <= now ||
                target.employeeId !== employeeId
            )
                continue;
            if (target.start < end && start < target.end)
                report.targetOverlapPairs++;
            if (
                target.clientId === clientId &&
                target.start === start &&
                target.end === end
            )
                report.nativeExactCandidates++;
        }
    }
    for (let i = 0; i < sourceIntervals.length; i++)
        for (let j = i + 1; j < sourceIntervals.length; j++) {
            const a = sourceIntervals[i],
                b = sourceIntervals[j];
            if (
                a.employeeId === b.employeeId &&
                a.start < b.end &&
                b.start < a.end
            )
                report.sourceOverlapPairs++;
        }
    report.targetActiveUpcoming = db.visits.filter(
        (v) => ACTIVE.has(v.status) && v.end > now,
    ).length;
    report.linkedActiveAbsentFromSource = db.visitLinks.filter((l) => {
        const v = visitById.get(l.localId);
        return (
            v &&
            ACTIVE.has(v.status) &&
            v.end > now &&
            !sourceIds.has(l.externalId)
        );
    }).length;
    // An export's completeness/freshness and owner GO cannot be established by this report.
    return report;
}

export async function readSnapshot(
    query: (sql: string) => Promise<unknown>,
): Promise<Snapshot> {
    await query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    try {
        await query("SET LOCAL statement_timeout = '30s'");
        const clock = (await query(
            "SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD HH24:MI:SS') AS now",
        )) as Array<{ now: string }>;
        const visits =
            (await query(`SELECT id, "clientId", "employeeId", "serviceId", to_char("startTime", 'YYYY-MM-DD HH24:MI:SS') AS start,
            to_char("endTime", 'YYYY-MM-DD HH24:MI:SS') AS end, status FROM appointments`)) as Visit[];
        const links = (await query(
            `SELECT entity, "externalId", "localId" FROM import_source_links WHERE source = 'booksy' AND entity IN ('appointment', 'client')`,
        )) as Array<Link & { entity: string }>;
        const staff = (await query(
            `SELECT id, name, role, "isSystemAdmin" FROM users WHERE role IN ('admin', 'employee', 'receptionist')`,
        )) as Staff[];
        return {
            now: clock[0].now,
            visits,
            staff,
            visitLinks: links.filter((l) => l.entity === 'appointment'),
            clientLinks: links.filter((l) => l.entity === 'client'),
        };
    } finally {
        await query('ROLLBACK');
    }
}

export async function main() {
    config({ quiet: true });
    if (
        process.env.TZ !== 'Europe/Warsaw' ||
        process.env.IMPORT_BOOKSY_APPLY === '1' ||
        process.env.IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS === '1'
    )
        throw new Error('Read-only guard rejected');
    const file = process.env.BOOKSY_APPOINTMENTS_CSV;
    if (!file) throw new Error('Source file required');
    let content: string;
    let modifiedAt: string | null = null;
    if (file === '-') {
        process.stdin.setEncoding('utf8');
        content = '';
        for await (const chunk of process.stdin as AsyncIterable<string>) {
            content += chunk;
            if (content.length > 64 * 1024 * 1024)
                throw new Error('Source too large');
        }
    } else {
        content = await readFile(file, 'utf8');
        modifiedAt = (await stat(file)).mtime.toISOString();
    }
    const rows = parseCsv(content);
    const staffMap = JSON.parse(
        process.env.IMPORT_BOOKSY_STAFF_MAP || '{}',
    ) as Record<string, number>;
    const db = new DataSource({
        type: 'postgres',
        ...(process.env.DATABASE_URL
            ? { url: process.env.DATABASE_URL }
            : {
                  host: process.env.DB_HOST || process.env.PGHOST,
                  port: Number(
                      process.env.DB_PORT || process.env.PGPORT || 5432,
                  ),
                  username: process.env.DB_USER || process.env.PGUSER,
                  password: process.env.DB_PASS || process.env.PGPASSWORD,
                  database: process.env.DB_NAME || process.env.PGDATABASE,
              }),
        logging: false,
        synchronize: false,
        ssl: process.env.PGSSL === '1' ? true : undefined,
    });
    await db.initialize();
    const runner = db.createQueryRunner();
    try {
        await runner.connect();
        const snapshot = await readSnapshot((sql) => runner.query(sql));
        console.log(
            JSON.stringify(
                {
                    mode: 'read-only',
                    observedAt: snapshot.now,
                    timeZone: 'Europe/Warsaw',
                    sourceSha256: createHash('sha256')
                        .update(content)
                        .digest('hex'),
                    sourceFileModifiedAt: modifiedAt,
                    sourceFreshness: 'UNVERIFIED',
                    ...reconcile(rows, snapshot, staffMap),
                },
                null,
                2,
            ),
        );
    } finally {
        await runner.release();
        await db.destroy();
    }
}
if (require.main === module)
    main().catch(() => {
        console.error(
            'Reconciliation failed; no source data or database details emitted.',
        );
        process.exitCode = 1;
    });
