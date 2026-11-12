import { DataSource, QueryRunner } from 'typeorm';
import { CreateCommunicationConsents1762630000000 } from './1762630000000-CreateCommunicationConsents';
import { AddWhatsAppAppointmentOptIn1794171600000 } from './1794171600000-AddWhatsAppAppointmentOptIn';

const testUrl = process.env.TEST_DATABASE_URL;
const describePg = testUrl ? describe : describe.skip;

/**
 * Recreates a POPULATED legacy users/consent database in disposable CI
 * PostgreSQL, then upgrades the two real production migration classes.
 * Never connects to MyDevil, hosted DEV or production databases.
 */
describePg('Existing consent data — forward-only PostgreSQL upgrade', () => {
    let dataSource: DataSource;
    let runner: QueryRunner;

    beforeAll(async () => {
        if (
            process.env.CI !== 'true' ||
            process.env.APP_ENV !== 'test' ||
            process.env.QA_CONSENT_UPGRADE_MODE !== 'disposable-only' ||
            process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
            process.env.PRODUCTION_DATABASE_URL ||
            !testUrl
        ) {
            throw new Error('CONSENT_UPGRADE_QA_WRONG_ENVIRONMENT');
        }

        const target = new URL(testUrl);
        if (
            target.protocol !== 'postgresql:' ||
            target.hostname !== '127.0.0.1' ||
            target.port !== '5432' ||
            target.pathname !== '/salonbw_consent_upgrade_qa'
        ) {
            throw new Error('CONSENT_UPGRADE_QA_WRONG_DATABASE');
        }

        dataSource = new DataSource({
            type: 'postgres',
            url: testUrl,
            synchronize: false,
            migrationsRun: false,
            entities: [],
        });
        await dataSource.initialize();
        runner = dataSource.createQueryRunner();
        await runner.connect();

        // Reject reuse or accidental execution on any populated schema.
        const existing = (await runner.query(
            "SELECT to_regclass('public.users') IS NOT NULL AS present",
        )) as Array<{ present: boolean }>;
        if (existing[0]?.present) {
            throw new Error('CONSENT_UPGRADE_QA_SCHEMA_NOT_EMPTY');
        }
    });

    afterAll(async () => {
        await runner?.release();
        await dataSource?.destroy();
    });

    it('preserves legacy flags, evidence and append-only audit while extending WhatsApp permissions', async () => {
        // Minimal pre-existing schema: users and legacy communication flags,
        // with real foreign-key behavior but no consent subsystem yet.
        await runner.query(`
            CREATE TABLE "users" (
                "id" integer PRIMARY KEY,
                "smsConsent" boolean NOT NULL DEFAULT false,
                "emailConsent" boolean NOT NULL DEFAULT false,
                "whatsappConsent" boolean NOT NULL DEFAULT false,
                "notifyWhatsapp" boolean NOT NULL DEFAULT false
            )
        `);
        await runner.query(`
            INSERT INTO "users"
                ("id", "smsConsent", "emailConsent", "whatsappConsent", "notifyWhatsapp")
            VALUES (101, true, true, true, true), (202, false, false, false, false)
        `);

        const createConsents = new CreateCommunicationConsents1762630000000();
        await createConsents.up(runner);

        // Existing legacy opt-in flags must not turn into fabricated grants.
        const [beforeConsent] = (await runner.query(
            'SELECT count(*)::integer AS count FROM "customer_consents"',
        )) as Array<{ count: number }>;
        expect(beforeConsent.count).toBe(0);

        const originalGrant = (await runner.query(`
            INSERT INTO "customer_consents" (
                "customer_id", "purpose", "channel", "status", "source",
                "actor_id", "actor_role", "recorded_at", "effective_at",
                "consent_text_version", "evidence_reference"
            )
            VALUES (
                101, 'DIRECT_MARKETING', 'SMS', 'GRANTED',
                'IN_PERSON_SIGNED_FORM', 202, 'admin',
                '2026-11-01T10:00:00Z', '2026-11-01T10:00:00Z',
                'marketing-v1', 'synthetic-evidence-001'
            )
            RETURNING id
        `)) as Array<{ id: number }>;

        await runner.query(`
            INSERT INTO "consent_events" (
                "customer_id", "actor_id", "actor_role", "source",
                "purpose", "channel", "event_type", "new_status",
                "occurred_at", "consent_text_version", "evidence_reference"
            )
            VALUES (
                101, 202, 'admin', 'IN_PERSON_SIGNED_FORM',
                'DIRECT_MARKETING', 'SMS', 'GRANTED', 'GRANTED',
                '2026-11-01T10:00:00Z', 'marketing-v1', 'synthetic-evidence-001'
            )
        `);
        await runner.query(`
            INSERT INTO "communication_preferences" (
                "customer_id", "communication_type", "channel",
                "enabled", "updated_at", "updated_by_id"
            )
            VALUES (
                101, 'APPOINTMENT_REMINDER', 'SMS', true,
                '2026-11-01T10:00:00Z', 202
            )
        `);

        const before = (await runner.query(
            `
            SELECT "purpose", "channel", "status", "source",
                   "consent_text_version", "evidence_reference"
            FROM "customer_consents" WHERE "id" = $1
        `,
            [originalGrant[0].id],
        )) as Array<Record<string, string>>;

        const whatsapp = new AddWhatsAppAppointmentOptIn1794171600000();
        await whatsapp.up(runner);

        const after = (await runner.query(
            `
            SELECT "purpose", "channel", "status", "source",
                   "consent_text_version", "evidence_reference"
            FROM "customer_consents" WHERE "id" = $1
        `,
            [originalGrant[0].id],
        )) as Array<Record<string, string>>;
        expect(after).toEqual(before);

        const legacyFlags = (await runner.query(
            'SELECT "smsConsent", "emailConsent", "whatsappConsent", "notifyWhatsapp" FROM "users" WHERE "id" = 101',
        )) as Array<Record<string, boolean>>;
        expect(Object.values(legacyFlags[0])).toEqual([true, true, true, true]);

        const priorEvents = (await runner.query(`
            SELECT "purpose", "event_type", "consent_text_version",
                   "evidence_reference"
            FROM "consent_events" WHERE "customer_id" = 101
        `)) as Array<Record<string, string>>;
        expect(priorEvents).toHaveLength(1);
        expect(priorEvents[0].purpose).toBe('DIRECT_MARKETING');

        const preferences = (await runner.query(`
            SELECT "enabled" FROM "communication_preferences"
            WHERE "customer_id" = 101 AND "communication_type" = 'APPOINTMENT_REMINDER'
        `)) as Array<{ enabled: boolean }>;
        expect(preferences[0]?.enabled).toBe(true);

        // Even an existing DIRECT_MARKETING WhatsApp grant may carry a
        // recipient address. Its evidence must survive a down migration.
        await runner.query(`
            INSERT INTO "customer_consents" (
                "customer_id", "purpose", "channel", "status", "source",
                "actor_id", "actor_role", "recorded_at", "effective_at",
                "consent_text_version", "contact_value"
            )
            VALUES (
                101, 'DIRECT_MARKETING', 'WHATSAPP', 'GRANTED',
                'SELF_SERVICE_PANEL', 101, 'client',
                '2026-11-02T09:00:00Z', '2026-11-02T09:00:00Z',
                'marketing-v1', '+48600123456'
            )
        `);
        await runner.query(`
            INSERT INTO "consent_events" (
                "customer_id", "actor_id", "actor_role", "source",
                "purpose", "channel", "event_type", "new_status",
                "consent_text_version", "contact_value"
            )
            VALUES (
                101, 101, 'client', 'SELF_SERVICE_PANEL',
                'DIRECT_MARKETING', 'WHATSAPP', 'GRANTED',
                'GRANTED', 'marketing-v1', '+48600123456'
            )
        `);
        await expect(whatsapp.down(runner)).rejects.toThrow(
            /Cannot roll back WhatsApp opt-in schema/,
        );

        // The new purpose and recipient binding are allowed, but only when
        // explicitly recorded; existing booleans are never promoted.
        await runner.query(`
            INSERT INTO "customer_consents" (
                "customer_id", "purpose", "channel", "status", "source",
                "actor_id", "actor_role", "recorded_at", "effective_at",
                "consent_text_version", "contact_value"
            )
            VALUES (
                101, 'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP', 'GRANTED',
                'SELF_SERVICE_PANEL', 101, 'client',
                '2026-11-02T10:00:00Z', '2026-11-02T10:00:00Z',
                'whatsapp-appointment-v1', '+48600123456'
            )
        `);
        await runner.query(`
            INSERT INTO "consent_events" (
                "customer_id", "actor_id", "actor_role", "source",
                "purpose", "channel", "event_type", "new_status",
                "consent_text_version", "contact_value"
            )
            VALUES (
                101, 101, 'client', 'SELF_SERVICE_PANEL',
                'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP', 'GRANTED',
                'GRANTED', 'whatsapp-appointment-v1', '+48600123456'
            )
        `);

        await expect(
            runner.query(`
                UPDATE "consent_events" SET "new_status" = 'WITHDRAWN'
                WHERE "customer_id" = 101
                  AND "purpose" = 'DIRECT_MARKETING'
            `),
        ).rejects.toThrow(/append-only/);

        // FK ON DELETE SET NULL is intentionally allowed without altering
        // evidence, e.g. erasure of the employee who originally recorded it.
        await runner.query('DELETE FROM "users" WHERE "id" = 202');
        const historicalActor = (await runner.query(`
            SELECT "actor_id", "evidence_reference"
            FROM "consent_events"
            WHERE "customer_id" = 101 AND "purpose" = 'DIRECT_MARKETING'
        `)) as Array<{ actor_id: number | null; evidence_reference: string }>;
        expect(historicalActor).toEqual([
            { actor_id: null, evidence_reference: 'synthetic-evidence-001' },
        ]);

        await expect(whatsapp.down(runner)).rejects.toThrow(
            /Cannot roll back WhatsApp opt-in schema/,
        );
        const allEvents = (await runner.query(`
            SELECT count(*)::integer AS count FROM "consent_events"
            WHERE "customer_id" = 101
        `)) as Array<{ count: number }>;
        expect(allEvents[0].count).toBe(3);

        // The initial expansion must never drop consent tables after
        // a customer has created permission, preference or audit records.
        await expect(createConsents.down(runner)).rejects.toThrow(
            /Cannot roll back consent schema/,
        );
        const originalStillPresent = (await runner.query(
            'SELECT count(*)::integer AS count FROM "customer_consents"',
        )) as Array<{ count: number }>;
        expect(originalStillPresent[0].count).toBe(3);

        console.log('V18_POPULATED_CONSENT_SCHEMA_UPGRADE=PASS');
        console.log('V18_WHATSAPP_EVIDENCE_ROLLBACK_GUARD=PASS');
        console.log('V18_ALL_CONTACT_EVIDENCE_ROLLBACK_GUARD=PASS');
        console.log('V18_BASE_CONSENT_SCHEMA_ROLLBACK_GUARD=PASS');
        console.log('V18_CONSENT_EVENT_APPEND_ONLY=PASS');
    });
});
