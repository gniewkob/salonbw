import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-time data bootstrap from the salon's Booksy export (2026-06-13).
 * Versum and Booksy are both retired; this becomes the canonical catalog.
 *
 * Imports Aleksandra Bodora's real service catalog — 27 Booksy parent services
 * expanded into 60 bookable, hair-length variants across 4 categories — and her
 * real weekly working hours, replacing the Day-1b placeholder timetable
 * (uniform Mon–Sat 09:00–17:00) that the slot engine and landing currently read.
 *
 * Why flat services (not Service + ServiceVariant rows): the online-booking flow
 * has no variant picker — it books by `serviceId` and the slot engine sizes the
 * appointment from `Service.duration` (calendar.service.ts). So each hair-length
 * variant must be its own Service with an exact duration/price, otherwise a
 * client booking "Koloryzacja — włosy bardzo długie" would reserve the wrong
 * block. The booking wizard groups the list by the legacy `category` string, so
 * both `category` (string) and `categoryId` (FK) are set.
 *
 * Idempotent: categories/services/assignments are inserted only when absent
 * (matched by name, and employee+service for assignments). Migrations run once,
 * but the guards keep a partial prior state safe to re-apply.
 */

type Cat = 'Fryzjerstwo' | 'Koloryzacja' | 'Pielęgnacja' | 'Przedłużanie';

interface SeedService {
    name: string;
    cat: Cat;
    dur: number; // minutes
    price: number; // PLN
}

// Exported so the follow-up cleanup migration shares one source of truth for
// the canonical Booksy catalog (it re-applies these values + hides everything
// else from online booking). Adding `export` does not change this migration's
// already-executed up().
export const CATEGORIES: Cat[] = [
    'Fryzjerstwo',
    'Koloryzacja',
    'Pielęgnacja',
    'Przedłużanie',
];

// Source: Booksy "USŁUGI" export. Duration in minutes, price in PLN (fixed).
export const SERVICES: SeedService[] = [
    // ---- Fryzjerstwo ----
    { name: 'Fryzura ślubna', cat: 'Fryzjerstwo', dur: 80, price: 280 },
    { name: 'Próbna fryzura ślubna', cat: 'Fryzjerstwo', dur: 60, price: 150 },
    {
        name: 'Fryzura wieczorowa – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 200,
    },
    {
        name: 'Fryzura wieczorowa – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 250,
    },
    {
        name: 'Fryzura wieczorowa – włosy bardzo długie',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 280,
    },
    {
        name: 'Modelowanie damskie – włosy krótkie',
        cat: 'Fryzjerstwo',
        dur: 70,
        price: 70,
    },
    {
        name: 'Modelowanie damskie – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 90,
        price: 90,
    },
    {
        name: 'Modelowanie damskie – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 90,
        price: 100,
    },
    {
        name: 'Strzyżenie damskie – włosy krótkie',
        cat: 'Fryzjerstwo',
        dur: 60,
        price: 150,
    },
    {
        name: 'Strzyżenie damskie – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 170,
    },
    {
        name: 'Strzyżenie damskie – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 90,
        price: 200,
    },
    { name: 'Strzyżenie grzywki', cat: 'Fryzjerstwo', dur: 25, price: 30 },
    {
        name: 'Strzyżenie męskie – włosy krótkie',
        cat: 'Fryzjerstwo',
        dur: 45,
        price: 80,
    },
    {
        name: 'Strzyżenie męskie – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 45,
        price: 90,
    },
    {
        name: 'Strzyżenie męskie – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 60,
        price: 100,
    },
    {
        name: 'Strzyżenie męskie maszynką',
        cat: 'Fryzjerstwo',
        dur: 45,
        price: 70,
    },
    {
        name: 'Strzyżenie brody + podgolenie',
        cat: 'Fryzjerstwo',
        dur: 60,
        price: 60,
    },
    {
        name: 'Strzyżenie włosy + broda',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 120,
    },
    {
        name: 'Trwała ondulacja – włosy krótkie',
        cat: 'Fryzjerstwo',
        dur: 180,
        price: 280,
    },
    {
        name: 'Trwała ondulacja – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 180,
        price: 300,
    },
    {
        name: 'Trwała ondulacja – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 180,
        price: 320,
    },
    {
        name: 'Trwała podnosząca – włosy krótkie',
        cat: 'Fryzjerstwo',
        dur: 180,
        price: 280,
    },
    {
        name: 'Trwała podnosząca – włosy średnie',
        cat: 'Fryzjerstwo',
        dur: 180,
        price: 300,
    },
    {
        name: 'Strzyżenie dziecięce dziewczynki – włosy długie',
        cat: 'Fryzjerstwo',
        dur: 60,
        price: 100,
    },
    {
        name: 'Strzyżenie dziecięce dziewczynki – włosy bardzo długie',
        cat: 'Fryzjerstwo',
        dur: 80,
        price: 120,
    },
    {
        name: 'Strzyżenie dziecięce chłopcy',
        cat: 'Fryzjerstwo',
        dur: 45,
        price: 70,
    },
    { name: 'Warkoczyk dziecięcy', cat: 'Fryzjerstwo', dur: 30, price: 40 },
    // ---- Koloryzacja ----
    {
        name: 'Koloryzacja – włosy krótkie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 320,
    },
    {
        name: 'Koloryzacja – włosy średnie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 340,
    },
    {
        name: 'Koloryzacja – włosy długie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 360,
    },
    {
        name: 'Koloryzacja – włosy bardzo długie',
        cat: 'Koloryzacja',
        dur: 210,
        price: 400,
    },
    {
        name: 'Koloryzacja AirTouch – włosy średnie',
        cat: 'Koloryzacja',
        dur: 250,
        price: 600,
    },
    {
        name: 'Koloryzacja AirTouch – włosy długie',
        cat: 'Koloryzacja',
        dur: 250,
        price: 700,
    },
    {
        name: 'Koloryzacja AirTouch – włosy bardzo długie',
        cat: 'Koloryzacja',
        dur: 300,
        price: 800,
    },
    {
        name: 'Odrosty – włosy krótkie',
        cat: 'Koloryzacja',
        dur: 150,
        price: 300,
    },
    {
        name: 'Odrosty – włosy średnie',
        cat: 'Koloryzacja',
        dur: 150,
        price: 320,
    },
    {
        name: 'Odrosty – włosy długie',
        cat: 'Koloryzacja',
        dur: 150,
        price: 340,
    },
    {
        name: 'Odrosty – włosy bardzo długie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 360,
    },
    {
        name: 'Olaplex do koloryzacji',
        cat: 'Koloryzacja',
        dur: 60,
        price: 60,
    },
    {
        name: 'Pielęgnacja do koloryzacji',
        cat: 'Koloryzacja',
        dur: 35,
        price: 70,
    },
    {
        name: 'Tonowanie Color Touch – włosy krótkie',
        cat: 'Koloryzacja',
        dur: 120,
        price: 240,
    },
    {
        name: 'Tonowanie Color Touch – włosy średnie',
        cat: 'Koloryzacja',
        dur: 135,
        price: 250,
    },
    {
        name: 'Tonowanie Color Touch – włosy długie',
        cat: 'Koloryzacja',
        dur: 150,
        price: 270,
    },
    {
        name: 'Tonowanie Color Touch – włosy bardzo długie',
        cat: 'Koloryzacja',
        dur: 170,
        price: 280,
    },
    {
        name: 'Rozjaśnienie globalne włosów – włosy krótkie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 400,
    },
    {
        name: 'Rozjaśnienie globalne włosów – włosy średnie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 600,
    },
    {
        name: 'Rozjaśnienie globalne włosów – włosy długie',
        cat: 'Koloryzacja',
        dur: 180,
        price: 700,
    },
    {
        name: 'Rozjaśnienie globalne włosów – włosy bardzo długie',
        cat: 'Koloryzacja',
        dur: 210,
        price: 800,
    },
    // ---- Pielęgnacja ----
    { name: 'Dermabrazja', cat: 'Pielęgnacja', dur: 70, price: 150 },
    {
        name: 'Botox na włosy – włosy krótkie',
        cat: 'Pielęgnacja',
        dur: 120,
        price: 300,
    },
    {
        name: 'Botox na włosy – włosy średnie',
        cat: 'Pielęgnacja',
        dur: 120,
        price: 350,
    },
    {
        name: 'Botox na włosy – włosy długie',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 400,
    },
    {
        name: 'Botox na włosy – włosy do pasa',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 450,
    },
    {
        name: 'Złote proteiny – włosy krótkie',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 350,
    },
    {
        name: 'Złote proteiny – włosy średnie',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 450,
    },
    {
        name: 'Złote proteiny – włosy długie',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 550,
    },
    {
        name: 'Złote proteiny – włosy bardzo długie',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 650,
    },
    {
        name: 'Złote proteiny – włosy do pasa',
        cat: 'Pielęgnacja',
        dur: 180,
        price: 700,
    },
    // ---- Przedłużanie ----
    {
        name: 'Przedłużanie włosów metodą Hair Extensions',
        cat: 'Przedłużanie',
        dur: 60,
        price: 1000,
    },
    {
        name: 'Korekta Hair Extensions',
        cat: 'Przedłużanie',
        dur: 60,
        price: 230,
    },
];

// Aleksandra's real weekly hours (DayOfWeek: 0=Mon … 6=Sun). Wed + Sun closed.
const WORK_HOURS: Array<{ day: number; open: string; close: string }> = [
    { day: 0, open: '09:00', close: '16:00' }, // Poniedziałek
    { day: 1, open: '12:00', close: '19:00' }, // Wtorek
    { day: 3, open: '12:00', close: '19:00' }, // Czwartek
    { day: 4, open: '09:00', close: '16:00' }, // Piątek
    { day: 5, open: '09:00', close: '13:00' }, // Sobota
];

export class SeedBooksyCatalogAndHours1760980000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Resolve the salon employee (Aleksandra). Anchor on the existing
        //    active timetable created in Day 1b; fall back to the first
        //    employee-role user. If neither exists, seed the catalog only.
        const ttRows: Array<{ employeeId: number }> = await queryRunner.query(
            `SELECT "employeeId" FROM "timetables" WHERE "isActive" = true ORDER BY "id" ASC LIMIT 1`,
        );
        let employeeId: number | null = ttRows[0]?.employeeId ?? null;
        if (employeeId == null) {
            const userRows: Array<{ id: number }> = await queryRunner.query(
                `SELECT "id" FROM "users" WHERE "role" = 'employee' ORDER BY "id" ASC LIMIT 1`,
            );
            employeeId = userRows[0]?.id ?? null;
        }

        // 2. Categories (idempotent by name) → id map.
        const categoryId: Record<string, number> = {};
        for (let i = 0; i < CATEGORIES.length; i++) {
            const name = CATEGORIES[i];
            await queryRunner.query(
                // Casts required: a bare $1 in the SELECT list + in WHERE makes
                // Postgres deduce inconsistent types ("inconsistent types
                // deduced for parameter $1"); pin them explicitly.
                `INSERT INTO "service_categories" ("name", "sortOrder", "isActive", "createdAt", "updatedAt")
                 SELECT $1::text, $2::int, true, now(), now()
                 WHERE NOT EXISTS (SELECT 1 FROM "service_categories" WHERE "name" = $1::text)`,
                [name, i],
            );
            const row: Array<{ id: number }> = await queryRunner.query(
                `SELECT "id" FROM "service_categories" WHERE "name" = $1 ORDER BY "id" ASC LIMIT 1`,
                [name],
            );
            categoryId[name] = row[0].id;
        }

        // 3. Services (idempotent by name). priceType 'fixed' — exact per variant.
        for (let i = 0; i < SERVICES.length; i++) {
            const s = SERVICES[i];
            await queryRunner.query(
                `INSERT INTO "services"
                   ("name", "description", "duration", "price", "priceType",
                    "category", "categoryId", "isActive", "onlineBooking", "sortOrder",
                    "createdAt", "updatedAt")
                 SELECT $1::text, '', $2::int, $3::numeric, 'fixed', $4::text, $5::int, true, true, $6::int, now(), now()
                 WHERE NOT EXISTS (SELECT 1 FROM "services" WHERE "name" = $1::text)`,
                [s.name, s.dur, s.price, s.cat, categoryId[s.cat], i],
            );
        }

        if (employeeId == null) {
            // No employee yet (Day 3 account not created) — catalog seeded,
            // assignments + hours skipped. Re-run path unavailable (run-once),
            // so this is logged for the deploy operator.

            console.warn(
                '[SeedBooksyCatalogAndHours] No employee found — services seeded but not assigned, hours not set.',
            );
            return;
        }

        // 4. Assign every seeded service to the employee (idempotent).
        for (const s of SERVICES) {
            await queryRunner.query(
                `INSERT INTO "employee_services" ("employeeId", "serviceId", "isActive", "createdAt")
                 SELECT $1::int, sv."id", true, now()
                 FROM "services" sv
                 WHERE sv."name" = $2::text
                   AND NOT EXISTS (
                     SELECT 1 FROM "employee_services" es
                     WHERE es."employeeId" = $1::int AND es."serviceId" = sv."id"
                       AND es."serviceVariantId" IS NULL
                   )`,
                [employeeId, s.name],
            );
        }

        // 5. Real weekly hours → replace the placeholder slots on her active
        //    timetable (create one if missing).
        const tt: Array<{ id: number }> = await queryRunner.query(
            `SELECT "id" FROM "timetables" WHERE "employeeId" = $1 AND "isActive" = true ORDER BY "id" ASC LIMIT 1`,
            [employeeId],
        );
        let timetableId: number;
        if (tt[0]?.id) {
            timetableId = tt[0].id;
            await queryRunner.query(
                `DELETE FROM "timetable_slots" WHERE "timetableId" = $1`,
                [timetableId],
            );
        } else {
            const created: Array<{ id: number }> = await queryRunner.query(
                `INSERT INTO "timetables" ("employeeId", "name", "validFrom", "isActive", "createdAt", "updatedAt")
                 VALUES ($1, 'Grafik podstawowy', CURRENT_DATE, true, now(), now())
                 RETURNING "id"`,
                [employeeId],
            );
            timetableId = created[0].id;
        }
        for (const h of WORK_HOURS) {
            await queryRunner.query(
                `INSERT INTO "timetable_slots" ("timetableId", "dayOfWeek", "startTime", "endTime", "isBreak", "createdAt")
                 VALUES ($1, $2, $3, $4, false, now())`,
                [timetableId, h.day, h.open, h.close],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the seeded catalog + assignments. The real working hours are
        // intentionally NOT reverted — the prior value was a stopgap placeholder.
        const names = SERVICES.map((s) => s.name);
        await queryRunner.query(
            `DELETE FROM "employee_services"
             WHERE "serviceId" IN (SELECT "id" FROM "services" WHERE "name" = ANY($1))`,
            [names],
        );
        await queryRunner.query(
            `DELETE FROM "services" WHERE "name" = ANY($1)`,
            [names],
        );
        await queryRunner.query(
            `DELETE FROM "service_categories" WHERE "name" = ANY($1)`,
            [CATEGORIES],
        );
    }
}
