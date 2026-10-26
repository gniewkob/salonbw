import { DataSource } from 'typeorm';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import {
    parseCsv,
    reconcile,
    readSnapshot,
    Snapshot,
} from '../../scripts/reconcile-booksy';
const row = (id = 'source-1', extra: Record<string, string> = {}) => ({
    booking_id: id,
    customer_card_id: 'card-1',
    staffer: 'Fixture Admin',
    booked_from: '2026-10-27 10:00:00',
    booked_till: '2026-10-27 11:00:00',
    status: 'confirmed',
    ...extra,
});
const snapshot = (): Snapshot => ({
    now: '2026-10-26 12:00:00',
    staff: [
        { id: 1, name: 'Fixture Admin', role: 'admin', isSystemAdmin: false },
    ],
    visits: [],
    clientLinks: [{ externalId: 'card-1', localId: 2 }],
    visitLinks: [],
});
const local = (extra = {}) => ({
    id: 3,
    clientId: 2,
    employeeId: 1,
    serviceId: 4,
    start: '2026-10-27 10:00:00',
    end: '2026-10-27 11:00:00',
    status: 'confirmed',
    ...extra,
});
describe('read-only Booksy reconciliation', () => {
    it('reports missing future rows without claiming GO', () => {
        expect(reconcile([row()], snapshot())).toMatchObject({
            missingUpcoming: 1,
            linkedUpcoming: 0,
            readyForImport: false,
        });
    });
    it('recognizes an existing external ID on repeated runs', () => {
        const db = snapshot();
        db.visits = [local()];
        db.visitLinks = [{ externalId: 'source-1', localId: 3 }];
        const result = reconcile([row()], db);
        expect(result).toEqual(reconcile([row()], db));
        expect(result).toMatchObject({
            missingUpcoming: 0,
            linkedUpcoming: 1,
            linkedDrift: 0,
        });
    });
    it.each(['cancelled', 'declined'])(
        'detects %s on linked future visits',
        (status) => {
            const db = snapshot();
            db.visits = [local()];
            db.visitLinks = [{ externalId: 'source-1', localId: 3 }];
            expect(
                reconcile([row('source-1', { status })], db).linkedDrift,
            ).toBe(1);
        },
    );
    it('detects rescheduled linked visits even when the source moved into the past', () => {
        const db = snapshot();
        db.visits = [local()];
        db.visitLinks = [{ externalId: 'source-1', localId: 3 }];
        expect(
            reconcile(
                [
                    row('source-1', {
                        booked_from: '2026-10-25 10:00:00',
                        booked_till: '2026-10-25 11:00:00',
                    }),
                ],
                db,
            ).linkedDrift,
        ).toBe(1);
    });
    it('reports duplicate external IDs, invalid dates and unknown statuses', () => {
        expect(
            reconcile(
                [
                    row(),
                    row(),
                    row('bad-date', { booked_from: '2026-02-30 10:00:00' }),
                    row('unknown', { status: 'unrecognized' }),
                ],
                snapshot(),
            ),
        ).toMatchObject({
            duplicateSourceIds: 1,
            invalidRows: 1,
            unknownStatuses: 1,
        });
    });
    it('reports dangling source links and missing client links', () => {
        const db = snapshot();
        db.visitLinks = [{ externalId: 'source-1', localId: 999 }];
        db.clientLinks = [];
        expect(reconcile([row(), row('source-2')], db)).toMatchObject({
            danglingVisitLinks: 1,
            missingClientLinks: 1,
        });
    });
    it('never guesses staff or uses the technical administrator', () => {
        const db = snapshot();
        db.staff[0].isSystemAdmin = true;
        expect(reconcile([row()], db).ambiguousStaff).toBe(1);
    });
    it('allows explicit staff aliases', () => {
        expect(
            reconcile([row('source-1', { staffer: 'Alias' })], snapshot(), {
                Alias: 1,
            }).ambiguousStaff,
        ).toBe(0);
    });
    it('detects native duplicates and overlapping slots without linking them', () => {
        const db = snapshot();
        db.visits = [
            local(),
            local({
                id: 4,
                start: '2026-10-27 10:30:00',
                end: '2026-10-27 11:30:00',
            }),
        ];
        expect(reconcile([row()], db)).toMatchObject({
            nativeExactCandidates: 1,
            targetOverlapPairs: 2,
            missingUpcoming: 1,
        });
    });
    it('ignores cancelled target slots, other staff and adjacent intervals', () => {
        const db = snapshot();
        db.visits = [
            local({ status: 'cancelled' }),
            local({ employeeId: 5 }),
            local({ start: '2026-10-27 11:00:00', end: '2026-10-27 12:00:00' }),
        ];
        expect(reconcile([row()], db).targetOverlapPairs).toBe(0);
    });
    it('reports source overlaps and linked target visits missing from an export', () => {
        const db = snapshot();
        db.visits = [local()];
        db.visitLinks = [{ externalId: 'absent', localId: 3 }];
        expect(reconcile([row(), row('source-2')], db)).toMatchObject({
            sourceOverlapPairs: 1,
            linkedActiveAbsentFromSource: 1,
        });
    });
    it('contains neither source identifiers nor personal fields in the report', () => {
        const result = JSON.stringify(
            reconcile(
                [
                    row('PRIVATE_ID', {
                        staffer: 'PRIVATE_NAME',
                        business_note: 'PRIVATE_NOTE',
                    }),
                ],
                snapshot(),
            ),
        );
        expect(result).not.toMatch(/PRIVATE/);
    });
    it('handles BOM, quoted commas, multiline notes, CRLF and escaped quotes', () => {
        const csv =
            '\uFEFFbooking_id,customer_card_id,staffer,booked_from,booked_till,status,note\r\n1,c,s,2026-10-27 10:00:00,2026-10-27 11:00:00,confirmed,"a,\nb ""c"""\r\n';
        expect(parseCsv(csv)[0].note).toBe('a,\nb "c"');
    });
    it.each([
        'booking_id,status\n1,confirmed',
        'booking_id,booking_id\n1,2',
        '"unfinished',
    ])('rejects malformed or incomplete CSV', (text) => {
        expect(() => parseCsv(text)).toThrow();
    });
    it('uses one read-only snapshot and always rolls back on query failure', async () => {
        const query = jest.fn(async (sql: string) => {
            if (sql.startsWith('SELECT'))
                throw new Error('private database error');
            return [];
        });
        await expect(readSnapshot(query)).rejects.toThrow();
        expect(query.mock.calls[0][0]).toBe(
            'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
        );
        expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
        expect(query.mock.calls.map((c) => c[0]).join(' ')).not.toMatch(
            /INSERT|UPDATE|DELETE|COMMIT/,
        );
    });
});

// Opt-in integration: only a disposable loopback database named booksy_synthetic.
// Build first; the real importer is executed against synthetic CSV fixtures.
const integrationUrl = process.env.BOOKSY_TEST_DATABASE_URL;
(integrationUrl ? describe : describe.skip)(
    'Booksy PostgreSQL import round trip',
    () => {
        it('plans without writes, applies once, reruns without duplicates and detects cancellation drift', async () => {
            const url = new URL(integrationUrl!);
            if (
                !['127.0.0.1', 'localhost'].includes(url.hostname) ||
                url.pathname !== '/booksy_synthetic'
            )
                throw new Error('Disposable database required');
            const root = resolve(__dirname, '../..');
            const db = new DataSource({
                type: 'postgres',
                url: integrationUrl,
                logging: false,
            });
            await db.initialize();
            const dir = await mkdtemp(join(tmpdir(), 'booksy-synthetic-'));
            const env = {
                ...process.env,
                DATABASE_URL: integrationUrl,
                TZ: 'Europe/Warsaw',
                IMPORT_BOOKSY_DIR: dir,
                IMPORT_BOOKSY_INCLUDE_FUTURE: '1',
                IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS: '0',
                IMPORT_BOOKSY_STAFF_MAP: '{}',
            };
            try {
                await db.query('DROP SCHEMA public CASCADE');
                await db.query('CREATE SCHEMA public');
                execFileSync(
                    process.execPath,
                    [join(root, 'dist/src/migrate.js')],
                    { cwd: root, env, stdio: 'pipe' },
                );
                await db.query(
                    `INSERT INTO users (email,password,name,role) VALUES ('fixture.staff@example.invalid','unusable-fixture','Fixture Admin','admin')`,
                );
                await writeFile(
                    join(dir, 'clients.csv'),
                    'client_card_id,name,cell_phone,email,booking_count,blacklisted,business_secret_note\n9001,Fixture Client,None,fixture.client@example.invalid,1,0,None\n',
                );
                const csv =
                    'booking_id,status,staffer,booked_from,booked_till,price,final_price,service_name,business_note,appointment_type,customer_card_id,booking_finished_at\n8001,confirmed,Fixture Admin,2099-01-18 10:00:00,2099-01-18 11:00:00,100,null,Fixture Service,null,Customer,9001,null\n';
                await writeFile(join(dir, 'appointments.csv'), csv);
                const run = (apply: boolean) => {
                    const out = execFileSync(
                        process.execPath,
                        [join(root, 'dist/scripts/import-booksy.js')],
                        {
                            cwd: root,
                            env: {
                                ...env,
                                IMPORT_BOOKSY_APPLY: apply ? '1' : '0',
                            },
                            encoding: 'utf8',
                        },
                    );
                    return JSON.parse(
                        out.slice(
                            out.indexOf('{', out.indexOf('Booksy import ')),
                            out.lastIndexOf('}') + 1,
                        ),
                    ) as {
                        visits: { create: number; alreadyImported: number };
                    };
                };
                expect(run(false).visits.create).toBe(1);
                expect(
                    await db.query(
                        'SELECT count(*)::int AS n FROM appointments',
                    ),
                ).toEqual([{ n: 0 }]);
                expect(run(true).visits.create).toBe(1);
                expect(run(true).visits).toMatchObject({
                    create: 0,
                    alreadyImported: 1,
                });
                expect(
                    await db.query(
                        'SELECT count(*)::int AS n FROM appointments',
                    ),
                ).toEqual([{ n: 1 }]);
                const runner = db.createQueryRunner();
                await runner.connect();
                let snap: Snapshot;
                try {
                    snap = await readSnapshot((sql) => runner.query(sql));
                } finally {
                    await runner.release();
                }
                expect(reconcile(parseCsv(csv), snap)).toMatchObject({
                    linkedUpcoming: 1,
                    missingUpcoming: 0,
                    linkedDrift: 0,
                });
                expect(
                    reconcile(
                        parseCsv(csv.replace(',confirmed,', ',cancelled,')),
                        snap,
                    ).linkedDrift,
                ).toBe(1);
                expect(
                    await db.query(
                        `SELECT "smsConsent", "emailConsent", "whatsappConsent", "gdprConsent", "termsConsent" FROM users WHERE role='client'`,
                    ),
                ).toEqual([
                    {
                        smsConsent: false,
                        emailConsent: false,
                        whatsappConsent: false,
                        gdprConsent: false,
                        termsConsent: false,
                    },
                ]);
                const guardRunner = db.createQueryRunner();
                await guardRunner.connect();
                try {
                    await guardRunner.query('BEGIN READ ONLY');
                    await expect(
                        guardRunner.query('DELETE FROM appointments'),
                    ).rejects.toThrow();
                } finally {
                    await guardRunner.query('ROLLBACK');
                    await guardRunner.release();
                }
            } finally {
                await db.destroy();
                await rm(dir, { recursive: true, force: true });
            }
        }, 120000);
    },
);
