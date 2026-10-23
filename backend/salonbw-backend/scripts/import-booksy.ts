import 'reflect-metadata';
import { DataSource, EntityManager, In } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { Service, PriceType } from '../src/services/service.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../src/appointments/appointment.entity';
import {
    BOOKSY_SOURCE,
    assignClientEmails,
    buildClientDescription,
    buildVisitInternalNote,
    cleanBooksyValue,
    mapBooksyStatus,
    median,
    normalizeBooksyEmail,
    normalizeBooksyPhone,
    parseBooksyDateTime,
    parseBooksyPrice,
    placeholderEmailForCard,
    serviceNameKey,
    splitBooksyName,
    matchReviewToVisit,
    reviewExternalId,
} from '../src/import/booksy-import-planning';

loadEnv();

/**
 * Imports clients, visit history and reviews from a Booksy business export.
 *
 *   IMPORT_BOOKSY_DIR=<folder with *clients.csv and *appointments.csv,
 *                      optionally *reviews.csv>
 *   TZ=Europe/Warsaw (required — see parseBooksyDateTime)
 *
 * Plan mode by default: reads the database, writes nothing and prints counts
 * only (no names, phones or e-mails). Options:
 *   IMPORT_BOOKSY_APPLY=1                  write, in one transaction
 *   IMPORT_BOOKSY_STAFF_MAP='{"Booksy name": <panel user id>}'
 *   IMPORT_BOOKSY_INCLUDE_FUTURE=1         also import upcoming bookings
 *   IMPORT_BOOKSY_ANONYMOUS=1              keep visits that have no client at
 *                                          all (card "null") on one shared
 *                                          archival client card instead of
 *                                          skipping them
 *   IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS=1 every client account (imported or
 *                                          not) gets an unusable password and
 *                                          its sessions are revoked
 *
 * A review is imported only when it can be tied to one client's visit (see
 * matchReviewToVisit); the rest stay out. Salon replies are not imported —
 * the panel has no field for them.
 *
 * Imported clients never get a usable password; each sets her own through
 * password recovery. Marketing consents are not set — the export has none.
 * Re-running on a newer export only adds what is not linked yet
 * (import_source_links), so the final delta at cutover is the same command.
 */

const CHUNK = 500;
const ANONYMOUS_CARD = 'anonymous';

type CsvRow = Record<string, string>;

function parseCsv(input: string): CsvRow[] {
    const text = input.replace(/^\uFEFF/, '');
    const records: string[][] = [];
    let field = '';
    let record: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }
        if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            record.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i += 1;
            record.push(field);
            field = '';
            if (record.some((value) => value !== '')) records.push(record);
            record = [];
        } else {
            field += char;
        }
    }
    record.push(field);
    if (record.some((value) => value !== '')) records.push(record);

    const [header, ...rows] = records;
    if (!header) return [];
    return rows.map((row) => {
        const out: CsvRow = {};
        header.forEach((key, index) => {
            out[key.trim()] = row[index] ?? '';
        });
        return out;
    });
}

async function readExport(dir: string, suffix: string): Promise<CsvRow[]> {
    const entries = await fs.readdir(dir);
    const matches = entries.filter((name) => name.endsWith(suffix));
    if (matches.length !== 1) {
        throw new Error(
            `Expected exactly one *${suffix} in ${dir}, found ${matches.length}.`,
        );
    }
    return parseCsv(await fs.readFile(path.join(dir, matches[0]), 'utf8'));
}

async function readOptionalExport(
    dir: string,
    suffix: string,
): Promise<CsvRow[] | null> {
    const entries = await fs.readdir(dir);
    return entries.some((name) => name.endsWith(suffix))
        ? readExport(dir, suffix)
        : null;
}

function requireColumns(rows: CsvRow[], columns: string[], file: string) {
    const first = rows[0];
    if (!first) throw new Error(`${file} is empty.`);
    const missing = columns.filter((column) => !(column in first));
    if (missing.length > 0) {
        throw new Error(`${file} lacks columns: ${missing.join(', ')}`);
    }
}

function chunks<T>(items: T[], size = CHUNK): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size));
    }
    return out;
}

function staffKey(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl-PL');
}

async function unusablePasswordHash(): Promise<string> {
    return bcrypt.hash(randomBytes(32).toString('base64url'), 10);
}

async function loadLinks(
    manager: EntityManager,
    entity: string,
): Promise<Map<string, number>> {
    const rows: Array<{ externalId: string; localId: number }> =
        await manager.query(
            `SELECT "externalId", "localId" FROM "import_source_links" WHERE "source" = $1 AND "entity" = $2`,
            [BOOKSY_SOURCE, entity],
        );
    return new Map(rows.map((row) => [row.externalId, Number(row.localId)]));
}

async function insertLinks(
    manager: EntityManager,
    entity: string,
    links: Array<{ externalId: string; localId: number }>,
): Promise<void> {
    for (const part of chunks(links)) {
        const values: unknown[] = [];
        const placeholders = part.map((link, index) => {
            values.push(BOOKSY_SOURCE, entity, link.externalId, link.localId);
            const base = index * 4;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        });
        await manager.query(
            `INSERT INTO "import_source_links" ("source", "entity", "externalId", "localId") VALUES ${placeholders.join(', ')}`,
            values,
        );
    }
}

async function run() {
    const dir = process.env.IMPORT_BOOKSY_DIR;
    if (!dir) throw new Error('Set IMPORT_BOOKSY_DIR to the export folder.');
    if (process.env.TZ !== 'Europe/Warsaw') {
        throw new Error(
            'Run with TZ=Europe/Warsaw, the same zone as the API, or visit times shift.',
        );
    }
    const apply = process.env.IMPORT_BOOKSY_APPLY === '1';
    const includeFuture = process.env.IMPORT_BOOKSY_INCLUDE_FUTURE === '1';
    const keepAnonymous = process.env.IMPORT_BOOKSY_ANONYMOUS === '1';
    const resetPasswords =
        process.env.IMPORT_BOOKSY_RESET_CLIENT_PASSWORDS === '1';
    const staffMapRaw = process.env.IMPORT_BOOKSY_STAFF_MAP;
    const staffMap = new Map<string, number>();
    if (staffMapRaw) {
        const parsed = JSON.parse(staffMapRaw) as Record<string, number>;
        for (const [name, id] of Object.entries(parsed)) {
            if (!Number.isInteger(id)) {
                throw new Error(
                    `IMPORT_BOOKSY_STAFF_MAP: "${name}" needs a user id.`,
                );
            }
            staffMap.set(staffKey(name), id);
        }
    }

    const clientsCsv = await readExport(dir, 'clients.csv');
    const visitsCsv = await readExport(dir, 'appointments.csv');
    const reviewsCsv = await readOptionalExport(dir, 'reviews.csv');
    if (reviewsCsv) {
        requireColumns(
            reviewsCsv,
            ['rank', 'staff', 'review', 'created', 'last_name', 'first_name'],
            'reviews.csv',
        );
    }
    requireColumns(
        clientsCsv,
        [
            'client_card_id',
            'name',
            'cell_phone',
            'email',
            'booking_count',
            'blacklisted',
            'business_secret_note',
        ],
        'clients.csv',
    );
    requireColumns(
        visitsCsv,
        [
            'booking_id',
            'status',
            'staffer',
            'booked_from',
            'booked_till',
            'price',
            'final_price',
            'service_name',
            'business_note',
            'appointment_type',
            'customer_card_id',
            'booking_finished_at',
        ],
        'appointments.csv',
    );

    const conflicts: string[] = [];
    const now = new Date();

    // ---- clients (file side) -------------------------------------------
    const seenCards = new Set<string>();
    const clients = clientsCsv.map((row, index) => {
        const cardId = row.client_card_id.trim();
        if (!/^\d+$/.test(cardId)) {
            conflicts.push(
                `clients.csv row ${index + 2}: invalid client_card_id.`,
            );
        }
        if (seenCards.has(cardId)) {
            conflicts.push(`clients.csv: card ${cardId} appears twice.`);
        }
        seenCards.add(cardId);
        const name = cleanBooksyValue(row.name);
        if (!name) conflicts.push(`clients.csv card ${cardId}: no name.`);
        return {
            cardId,
            ...splitBooksyName(name ?? `Klientka ${cardId}`),
            phone: normalizeBooksyPhone(row.cell_phone),
            email: normalizeBooksyEmail(row.email),
            bookingCount: Number(row.booking_count) || 0,
            description: buildClientDescription({
                secretNote: cleanBooksyValue(row.business_secret_note),
                blacklisted: row.blacklisted.trim() === '1',
            }),
        };
    });
    const { emailByCard, sharedEmailCards } = assignClientEmails(clients);
    const phoneCounts = new Map<string, number>();
    for (const client of clients) {
        if (client.phone) {
            phoneCounts.set(
                client.phone,
                (phoneCounts.get(client.phone) ?? 0) + 1,
            );
        }
    }
    const cardsSharingPhone = clients
        .filter(
            (client) =>
                client.phone && (phoneCounts.get(client.phone) ?? 0) > 1,
        )
        .map((client) => client.cardId);

    // ---- visits (file side) --------------------------------------------
    const unknownStatuses = new Map<string, number>();
    const visits = visitsCsv.flatMap((row, index) => {
        const mapped = mapBooksyStatus(row.status);
        if (!mapped) {
            unknownStatuses.set(
                row.status,
                (unknownStatuses.get(row.status) ?? 0) + 1,
            );
            return [];
        }
        const start = parseBooksyDateTime(row.booked_from);
        const end = parseBooksyDateTime(row.booked_till);
        if (!start || !end || end <= start) {
            conflicts.push(
                `appointments.csv row ${index + 2}: invalid time range.`,
            );
            return [];
        }
        return [
            {
                bookingId: row.booking_id.trim(),
                cardId:
                    cleanBooksyValue(row.customer_card_id) ?? ANONYMOUS_CARD,
                staffer: row.staffer.trim(),
                serviceName:
                    cleanBooksyValue(row.service_name) ?? 'Usługa z Booksy',
                start,
                end,
                finishedAt: parseBooksyDateTime(row.booking_finished_at),
                price: parseBooksyPrice(row.price),
                finalPrice: parseBooksyPrice(row.final_price),
                businessNote: cleanBooksyValue(row.business_note),
                reservedOnline: row.appointment_type.trim() === 'Customer',
                ...mapped,
            },
        ];
    });
    for (const [status, count] of unknownStatuses) {
        conflicts.push(
            `appointments.csv: unknown status "${status}" (${count} rows).`,
        );
    }

    // ---- database ------------------------------------------------------
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
        clients: {
            inFile: clients.length,
            alreadyImported: 0,
            linkedToExistingByEmail: 0,
            linkedToExistingByPhone: 0,
            create: 0,
            createWithRealEmail: 0,
            createWithPlaceholderEmail: 0,
            sharedEmailFallbackToPlaceholder: sharedEmailCards.length,
            cardsSharingPhone: cardsSharingPhone.length,
            withStaffNote: clients.filter((client) => client.description)
                .length,
        },
        visits: {
            inFile: visitsCsv.length,
            alreadyImported: 0,
            create: 0,
            byStatus: {} as Record<string, number>,
            skippedFuture: 0,
            skippedUnknownClient: 0,
            withoutClientData: 0,
            anonymousCard: keepAnonymous ? 'create' : 'off',
            withInternalNote: 0,
        },
        services: {
            historicalNames: 0,
            matchedActive: 0,
            matchedInactive: 0,
            createArchival: [] as Array<{ name: string; visits: number }>,
        },
        staff: [] as Array<{
            booksyName: string;
            visits: number;
            panelUserId: number | null;
        }>,
        reviews: {
            inFile: reviewsCsv?.length ?? 0,
            alreadyImported: 0,
            create: 0,
            notLinkable: 0,
            sameVisitTwice: 0,
            visitAlreadyReviewed: 0,
        },
        passwordReset: { clientAccounts: 0 },
        conflicts,
    };

    await dataSource.initialize();
    try {
        await dataSource.transaction(async (manager) => {
            const userRepo = manager.getRepository(User);
            const serviceRepo = manager.getRepository(Service);
            const appointmentRepo = manager.getRepository(Appointment);

            const tableExists: Array<{ exists: boolean }> = await manager.query(
                `SELECT to_regclass('public.import_source_links') IS NOT NULL AS "exists"`,
            );
            if (!tableExists[0]?.exists) {
                throw new Error(
                    'Table import_source_links is missing — run migrations first.',
                );
            }

            // ---- staff mapping -----------------------------------------
            const staffUsers = await userRepo.find({
                where: {
                    role: In([Role.Admin, Role.Employee, Role.Receptionist]),
                },
            });
            const staffById = new Map(
                staffUsers.map((user) => [user.id, user]),
            );
            const staffByName = new Map<string, User[]>();
            for (const user of staffUsers) {
                const key = staffKey(user.name);
                staffByName.set(key, [...(staffByName.get(key) ?? []), user]);
            }
            const stafferCounts = new Map<string, number>();
            for (const visit of visits) {
                stafferCounts.set(
                    visit.staffer,
                    (stafferCounts.get(visit.staffer) ?? 0) + 1,
                );
            }
            const staffResolution = new Map<string, User | null>();
            for (const [staffer, count] of [...stafferCounts].sort(
                (a, b) => b[1] - a[1],
            )) {
                let user: User | null = null;
                const mappedId = staffMap.get(staffKey(staffer));
                if (mappedId !== undefined) {
                    user = staffById.get(mappedId) ?? null;
                    if (!user) {
                        conflicts.push(
                            `IMPORT_BOOKSY_STAFF_MAP: user ${mappedId} for "${staffer}" is not a staff account.`,
                        );
                    }
                } else {
                    const byName = staffByName.get(staffKey(staffer)) ?? [];
                    if (byName.length === 1) user = byName[0];
                }
                if (!user && mappedId === undefined) {
                    conflicts.push(
                        `Booksy staffer "${staffer}" (${count} visits) has no panel account — add it to IMPORT_BOOKSY_STAFF_MAP.`,
                    );
                }
                staffResolution.set(staffer, user);
                report.staff.push({
                    booksyName: staffer,
                    visits: count,
                    panelUserId: user?.id ?? null,
                });
            }

            // ---- service mapping ---------------------------------------
            const services = await serviceRepo.find();
            const serviceByKey = new Map<string, Service>();
            for (const service of services) {
                const key = serviceNameKey(service.name);
                const current = serviceByKey.get(key);
                // An active service wins; among equals the oldest id wins.
                if (
                    !current ||
                    (service.isActive && !current.isActive) ||
                    (service.isActive === current.isActive &&
                        service.id < current.id)
                ) {
                    serviceByKey.set(key, service);
                }
            }
            const historical = new Map<
                string,
                {
                    name: string;
                    visits: number;
                    prices: number[];
                    minutes: number[];
                }
            >();
            for (const visit of visits) {
                const key = serviceNameKey(visit.serviceName);
                const entry = historical.get(key) ?? {
                    name: visit.serviceName.trim(),
                    visits: 0,
                    prices: [],
                    minutes: [],
                };
                entry.visits += 1;
                if (visit.price !== null) entry.prices.push(visit.price);
                entry.minutes.push(
                    Math.round(
                        (visit.end.getTime() - visit.start.getTime()) / 60000,
                    ),
                );
                historical.set(key, entry);
            }
            report.services.historicalNames = historical.size;
            const serviceIdByKey = new Map<string, number>();
            const archivalToCreate: Array<{
                key: string;
                entry: {
                    name: string;
                    visits: number;
                    prices: number[];
                    minutes: number[];
                };
            }> = [];
            for (const [key, entry] of historical) {
                const existing = serviceByKey.get(key);
                if (existing) {
                    if (existing.isActive) report.services.matchedActive += 1;
                    else report.services.matchedInactive += 1;
                    serviceIdByKey.set(key, existing.id);
                } else {
                    archivalToCreate.push({ key, entry });
                    report.services.createArchival.push({
                        name: entry.name,
                        visits: entry.visits,
                    });
                }
            }
            report.services.createArchival.sort((a, b) => b.visits - a.visits);

            // ---- client matching ---------------------------------------
            const clientLinks = await loadLinks(manager, 'client');
            const existingUsers = await userRepo.find({
                select: { id: true, email: true, phone: true, role: true },
            });
            const userByEmail = new Map(
                existingUsers.map((user) => [user.email.toLowerCase(), user]),
            );
            const clientsByPhone = new Map<string, User[]>();
            for (const user of existingUsers) {
                if (user.role !== Role.Client || !user.phone) continue;
                const phone = normalizeBooksyPhone(user.phone);
                if (!phone) continue;
                clientsByPhone.set(phone, [
                    ...(clientsByPhone.get(phone) ?? []),
                    user,
                ]);
            }
            const userIdByCard = new Map<string, number>(clientLinks);
            const newLinks: Array<{ externalId: string; localId: number }> = [];
            const toCreate: typeof clients = [];
            const claimedUserIds = new Set<number>(clientLinks.values());
            for (const client of clients) {
                const linked = clientLinks.get(client.cardId);
                if (linked !== undefined) {
                    report.clients.alreadyImported += 1;
                    userIdByCard.set(client.cardId, linked);
                    continue;
                }
                const email = emailByCard.get(client.cardId) ?? null;
                const byEmail = email ? userByEmail.get(email) : undefined;
                if (byEmail) {
                    if (byEmail.role !== Role.Client) {
                        conflicts.push(
                            `clients.csv card ${client.cardId}: e-mail belongs to a staff account (user ${byEmail.id}).`,
                        );
                        continue;
                    }
                    if (!claimedUserIds.has(byEmail.id)) {
                        report.clients.linkedToExistingByEmail += 1;
                        claimedUserIds.add(byEmail.id);
                        userIdByCard.set(client.cardId, byEmail.id);
                        newLinks.push({
                            externalId: client.cardId,
                            localId: byEmail.id,
                        });
                        continue;
                    }
                }
                const byPhone = client.phone
                    ? (clientsByPhone.get(client.phone) ?? [])
                    : [];
                if (
                    byPhone.length === 1 &&
                    (phoneCounts.get(client.phone!) ?? 0) === 1 &&
                    !claimedUserIds.has(byPhone[0].id)
                ) {
                    report.clients.linkedToExistingByPhone += 1;
                    claimedUserIds.add(byPhone[0].id);
                    userIdByCard.set(client.cardId, byPhone[0].id);
                    newLinks.push({
                        externalId: client.cardId,
                        localId: byPhone[0].id,
                    });
                    continue;
                }
                toCreate.push(client);
            }
            const anonymousVisits = visits.filter(
                (visit) => visit.cardId === ANONYMOUS_CARD,
            ).length;
            report.visits.withoutClientData = anonymousVisits;
            if (keepAnonymous && anonymousVisits > 0) {
                if (clientLinks.has(ANONYMOUS_CARD)) {
                    report.visits.anonymousCard = 'existing';
                } else {
                    toCreate.push({
                        cardId: ANONYMOUS_CARD,
                        ...splitBooksyName('Wizyty bez danych klientki'),
                        phone: null,
                        email: null,
                        bookingCount: 0,
                        description:
                            'Zbiorcza karta z importu Booksy: wizyty zapisane w Booksy bez klientki (głównie historia z Versum).',
                    });
                }
            }
            report.clients.create = toCreate.length;
            const finalEmail = (client: (typeof clients)[number]) => {
                const email = emailByCard.get(client.cardId) ?? null;
                // An address another account already owns cannot be reused.
                return email && !userByEmail.has(email) ? email : null;
            };
            report.clients.createWithRealEmail = toCreate.filter((client) =>
                finalEmail(client),
            ).length;
            report.clients.createWithPlaceholderEmail =
                toCreate.length - report.clients.createWithRealEmail;

            // ---- visit selection ---------------------------------------
            const visitLinks = await loadLinks(manager, 'appointment');
            const cardsInFile = new Set(clients.map((client) => client.cardId));
            const visitsToCreate = visits.filter((visit) => {
                if (visitLinks.has(visit.bookingId)) {
                    report.visits.alreadyImported += 1;
                    return false;
                }
                if (visit.cardId === ANONYMOUS_CARD) {
                    if (!keepAnonymous) return false;
                } else if (
                    !cardsInFile.has(visit.cardId) &&
                    !clientLinks.has(visit.cardId)
                ) {
                    report.visits.skippedUnknownClient += 1;
                    return false;
                }
                if (
                    visit.status === AppointmentStatus.Confirmed &&
                    !includeFuture
                ) {
                    report.visits.skippedFuture += 1;
                    return false;
                }
                return true;
            });
            report.visits.create = visitsToCreate.length;
            for (const visit of visitsToCreate) {
                report.visits.byStatus[visit.status] =
                    (report.visits.byStatus[visit.status] ?? 0) + 1;
                if (visit.businessNote) report.visits.withInternalNote += 1;
            }

            // ---- review linking -----------------------------------------
            const reviewLinks = await loadLinks(manager, 'review');
            const reviewCandidates = clients.map((client) => ({
                cardId: client.cardId,
                nameParts: client.name.toLocaleLowerCase('pl-PL').split(' '),
            }));
            const finishedByCard = new Map<
                string,
                Array<{ bookingId: string; end: Date }>
            >();
            for (const visit of visits) {
                if (visit.status !== AppointmentStatus.Completed) continue;
                const list = finishedByCard.get(visit.cardId) ?? [];
                list.push({ bookingId: visit.bookingId, end: visit.end });
                finishedByCard.set(visit.cardId, list);
            }
            const importableVisitIds = new Set([
                ...visitLinks.keys(),
                ...visitsToCreate.map((visit) => visit.bookingId),
            ]);
            const reviewedVisits = new Set<string>();
            const reviewsToCreate: Array<{
                externalId: string;
                bookingId: string;
                rating: number;
                comment: string | null;
                createdAt: Date;
            }> = [];
            for (const row of reviewsCsv ?? []) {
                const externalId = reviewExternalId({
                    created: row.created,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    rank: row.rank,
                });
                if (reviewLinks.has(externalId)) {
                    report.reviews.alreadyImported += 1;
                    continue;
                }
                const createdAt = parseBooksyDateTime(row.created);
                const rating = Number(row.rank);
                const match =
                    createdAt && Number.isInteger(rating)
                        ? matchReviewToVisit(
                              {
                                  firstName: row.first_name,
                                  lastName: row.last_name,
                                  createdAt,
                              },
                              reviewCandidates,
                              finishedByCard,
                          )
                        : null;
                if (
                    !match ||
                    !createdAt ||
                    rating < 1 ||
                    rating > 5 ||
                    !importableVisitIds.has(match.bookingId)
                ) {
                    report.reviews.notLinkable += 1;
                    continue;
                }
                if (reviewedVisits.has(match.bookingId)) {
                    report.reviews.sameVisitTwice += 1;
                    continue;
                }
                reviewedVisits.add(match.bookingId);
                reviewsToCreate.push({
                    externalId,
                    bookingId: match.bookingId,
                    rating,
                    comment: cleanBooksyValue(row.review),
                    createdAt,
                });
            }
            // A visit linked in an earlier run may already carry a review
            // (written by the client in the panel); never add a second one.
            const reviewedRows: Array<{ id: number }> = await manager.query(
                `SELECT DISTINCT "appointmentId" AS id FROM "reviews" WHERE "appointmentId" IS NOT NULL`,
            );
            const alreadyReviewed = new Set(
                reviewedRows.map((row) => Number(row.id)),
            );
            const reviewsReady = reviewsToCreate.filter((review) => {
                const local = visitLinks.get(review.bookingId);
                if (local !== undefined && alreadyReviewed.has(local)) {
                    report.reviews.visitAlreadyReviewed += 1;
                    return false;
                }
                return true;
            });
            report.reviews.create = reviewsReady.length;

            const passwordTargets: Array<{ id: number }> = resetPasswords
                ? await userRepo.find({
                      select: { id: true },
                      where: { role: Role.Client },
                  })
                : [];
            report.passwordReset.clientAccounts = passwordTargets.length;

            if (!apply) return;
            if (conflicts.length > 0) {
                throw new Error(
                    `Import blocked by conflicts:\n${conflicts.join('\n')}`,
                );
            }

            // ---- writes ------------------------------------------------
            for (const { key, entry } of archivalToCreate) {
                const saved = await serviceRepo.save(
                    serviceRepo.create({
                        name: entry.name.slice(0, 255),
                        description: 'Usługa historyczna z importu Booksy.',
                        duration: Math.max(
                            5,
                            Math.round(median(entry.minutes) ?? 60),
                        ),
                        price:
                            Math.round((median(entry.prices) ?? 0) * 100) / 100,
                        priceType: PriceType.Fixed,
                        isActive: false,
                        onlineBooking: false,
                    }),
                );
                serviceIdByKey.set(key, saved.id);
            }

            for (const part of chunks(toCreate)) {
                const rows = [];
                for (const client of part) {
                    rows.push({
                        email:
                            finalEmail(client) ??
                            placeholderEmailForCard(client.cardId),
                        password: await unusablePasswordHash(),
                        name: client.name,
                        firstName: client.firstName ?? undefined,
                        lastName: client.lastName ?? undefined,
                        phone: client.phone,
                        role: Role.Client,
                        description: client.description ?? undefined,
                        smsConsent: false,
                        emailConsent: false,
                        whatsappConsent: false,
                        gdprConsent: false,
                        termsConsent: false,
                    });
                }
                const result = await userRepo.insert(rows);
                part.forEach((client, index) => {
                    const id = Number(result.identifiers[index].id);
                    userIdByCard.set(client.cardId, id);
                    newLinks.push({ externalId: client.cardId, localId: id });
                });
            }
            await insertLinks(manager, 'client', newLinks);

            const visitRows = visitsToCreate.map((visit) => {
                const employee = staffResolution.get(visit.staffer)!;
                const clientId = userIdByCard.get(visit.cardId)!;
                const completed = visit.status === AppointmentStatus.Completed;
                return {
                    clientId,
                    employeeId: employee.id,
                    serviceId: serviceIdByKey.get(
                        serviceNameKey(visit.serviceName),
                    )!,
                    startTime: visit.start,
                    endTime: visit.end,
                    status: visit.status,
                    internalNote:
                        buildVisitInternalNote({
                            businessNote: visit.businessNote,
                            originalStaffer: visit.staffer,
                            attributedTo: employee.name,
                        }) ?? undefined,
                    reservedOnline: visit.reservedOnline,
                    // Spend history: what Booksy recorded as charged, else
                    // the price at booking. Payment method is unknown.
                    paidAmount: completed
                        ? (visit.finalPrice ?? visit.price ?? undefined)
                        : undefined,
                    finalizedAt: completed
                        ? (visit.finishedAt ?? visit.end)
                        : undefined,
                    cancellationReason: visit.cancellationReason ?? undefined,
                    // History must not trigger reminder sends.
                    reminderSent: visit.start < now,
                };
            });
            const visitLinkRows: Array<{
                externalId: string;
                localId: number;
            }> = [];
            for (const [partIndex, part] of chunks(visitRows).entries()) {
                const result = await appointmentRepo.insert(part);
                part.forEach((_, index) => {
                    visitLinkRows.push({
                        externalId:
                            visitsToCreate[partIndex * CHUNK + index].bookingId,
                        localId: Number(result.identifiers[index].id),
                    });
                });
            }
            await insertLinks(manager, 'appointment', visitLinkRows);

            const visitLocalId = new Map(visitLinks);
            for (const link of visitLinkRows) {
                visitLocalId.set(link.externalId, link.localId);
            }
            const reviewLinkRows: Array<{
                externalId: string;
                localId: number;
            }> = [];
            for (const review of reviewsReady) {
                const appointmentId = visitLocalId.get(review.bookingId)!;
                // Client and employee come from the visit itself, so the
                // review always agrees with the visit it is attached to.
                const inserted: Array<{ id: number }> = await manager.query(
                    `INSERT INTO "reviews" ("clientId", "employeeId", "appointmentId", "rating", "comment", "createdAt")
                     SELECT a."clientId", a."employeeId", a."id", $2, $3, $4 FROM "appointments" a WHERE a."id" = $1
                     RETURNING "id"`,
                    [
                        appointmentId,
                        review.rating,
                        review.comment,
                        review.createdAt,
                    ],
                );
                reviewLinkRows.push({
                    externalId: review.externalId,
                    localId: Number(inserted[0].id),
                });
            }
            await insertLinks(manager, 'review', reviewLinkRows);

            for (const target of passwordTargets) {
                await manager.query(
                    `UPDATE "users" SET "password" = $1, "authVersion" = "authVersion" + 1 WHERE "id" = $2`,
                    [await unusablePasswordHash(), target.id],
                );
            }
        });
    } finally {
        await dataSource.destroy();
    }

    console.log(`Booksy import ${report.mode}:`);
    console.log(JSON.stringify(report, null, 2));
    if (conflicts.length > 0) {
        throw new Error(
            `Import blocked by conflicts:\n${conflicts.join('\n')}`,
        );
    }
    if (!apply) {
        console.log(
            'No DB changes. Set IMPORT_BOOKSY_APPLY=1 only after reviewing this plan and taking a backup.',
        );
    }
}

run().catch((err) => {
    console.error('Import failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
