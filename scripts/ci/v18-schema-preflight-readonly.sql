-- SalonBW V18: production schema compatibility inventory (READ ONLY).
-- Run only with a read-only PostgreSQL role, using psql -X -v ON_ERROR_STOP=1.
-- Inspects catalog metadata and TypeORM migration NAMES only; no customer rows.
-- This is NOT a migration rehearsal, data backup, rollback, or production GO.
\set ON_ERROR_STOP on
\pset pager off

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '10s';
SET LOCAL lock_timeout = '2s';

DO $v18_schema_preflight$
DECLARE
    schema_name text := current_schema();
    table_name text;
    base_count integer;
    whatsapp_count integer;
    table_count integer;
    fk_count integer;
    check_count integer;
    required_table text[] := ARRAY[
        'consent_requests', 'customer_consents',
        'communication_preferences', 'consent_events'
    ];
BEGIN
    IF schema_name IS NULL OR schema_name IN ('pg_catalog', 'information_schema') THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: no safe application schema on search_path';
    END IF;

    IF to_regclass(format('%I.users', schema_name)) IS NULL THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: users table absent';
    END IF;
    IF to_regclass(format('%I.migrations', schema_name)) IS NULL THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: TypeORM migrations registry absent';
    END IF;

    -- Only catalog columns; never inspect personal rows, phones or credentials.
    IF EXISTS (
        SELECT 1
        FROM (VALUES ('id'), ('role'), ('phone'), ('smsConsent'),
                     ('emailConsent'), ('whatsappConsent'),
                     ('notifyWhatsapp')) AS required(column_name)
        WHERE NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = to_regclass(format('%I.users', schema_name))
              AND a.attname = required.column_name
              AND a.attnum > 0 AND NOT a.attisdropped
        )
    ) THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: legacy users columns differ from expected API contract';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_attribute a
        WHERE a.attrelid = to_regclass(format('%I.users', schema_name))
          AND a.attname = 'id' AND a.atttypid = 'pg_catalog.int4'::regtype
          AND a.attnum > 0 AND NOT a.attisdropped
    ) THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: users.id is not integer';
    END IF;

    -- Only read TypeORM migration *names*, never customer data.
    EXECUTE format('SELECT count(*) FROM %I.migrations WHERE name = $1', schema_name)
        INTO base_count USING 'CreateCommunicationConsents1762630000000';
    EXECUTE format('SELECT count(*) FROM %I.migrations WHERE name = $1', schema_name)
        INTO whatsapp_count USING 'AddWhatsAppAppointmentOptIn1794171600000';
    IF base_count NOT IN (0, 1) OR whatsapp_count NOT IN (0, 1)
       OR (whatsapp_count = 1 AND base_count = 0) THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: migration history is duplicated or out of order';
    END IF;

    SELECT count(*) INTO table_count
    FROM unnest(required_table) AS t(name)
    WHERE to_regclass(format('%I.%I', schema_name, t.name)) IS NOT NULL;
    IF (base_count = 0 AND table_count <> 0)
       OR (base_count = 1 AND table_count <> 4) THEN
        RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: consent table collision or partial migration (base %, tables %)',
            base_count, table_count;
    END IF;

    IF base_count = 0 THEN
        IF EXISTS (
            SELECT 1 FROM pg_catalog.pg_proc p
            JOIN pg_catalog.pg_namespace ns ON ns.oid = p.pronamespace
            WHERE ns.nspname = schema_name
              AND p.proname = 'consent_events_reject_update'
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: consent audit function name collision';
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1
            FROM (VALUES
                ('consent_requests', 'idempotency_key'),
                ('customer_consents', 'customer_id'),
                ('customer_consents', 'purpose'),
                ('customer_consents', 'channel'),
                ('communication_preferences', 'communication_type'),
                ('consent_events', 'customer_id'),
                ('consent_events', 'purpose'),
                ('consent_events', 'event_type')
            ) AS required(tab, col)
            WHERE NOT EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a
                WHERE a.attrelid = to_regclass(format('%I.%I', schema_name, required.tab))
                  AND a.attname = required.col
                  AND a.attnum > 0 AND NOT a.attisdropped
            )
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: consent columns missing despite recorded migration';
        END IF;

        SELECT count(DISTINCT c.conrelid) INTO fk_count
        FROM pg_catalog.pg_constraint c
        JOIN pg_catalog.pg_class cl ON cl.oid = c.conrelid
        JOIN pg_catalog.pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = schema_name
          AND cl.relname = ANY(required_table)
          AND c.contype = 'f'
          AND c.confrelid = to_regclass(format('%I.users', schema_name))
          AND c.confdeltype = 'c';
        IF fk_count <> 4 THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: consent customer FK CASCADE contract mismatch';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_trigger t
            WHERE t.tgrelid = to_regclass(format('%I.consent_events', schema_name))
              AND t.tgname = 'TRG_consent_events_append_only'
              AND t.tgenabled IN ('O', 'A')
              AND NOT t.tgisinternal
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: append-only audit trigger absent or disabled';
        END IF;
    END IF;

    IF base_count = 1 THEN
        SELECT count(*) INTO check_count
        FROM (VALUES ('customer_consents'), ('consent_events')) AS x(tab)
        WHERE EXISTS (
            SELECT 1 FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = to_regclass(format('%I.%I', schema_name, x.tab))
              AND a.attname = 'contact_value'
              AND a.attnum > 0 AND NOT a.attisdropped
        );
        IF (whatsapp_count = 0 AND check_count <> 0)
           OR (whatsapp_count = 1 AND check_count <> 2) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: contact_value columns do not match migration history';
        END IF;

        IF whatsapp_count = 1 THEN
            IF EXISTS (
                SELECT 1 FROM (VALUES
                    ('customer_consents', 'CHK_customer_consents_purpose_v2'),
                    ('consent_events', 'CHK_consent_events_purpose_v2')
                ) AS x(tab, con)
                WHERE NOT EXISTS (
                    SELECT 1 FROM pg_catalog.pg_constraint c
                    WHERE c.conrelid = to_regclass(format('%I.%I', schema_name, x.tab))
                      AND c.conname = x.con AND c.contype = 'c' AND c.convalidated
                )
            ) THEN
                RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: WhatsApp v2 CHECK constraints absent/unvalidated';
            END IF;
            IF EXISTS (
                SELECT 1 FROM pg_catalog.pg_constraint c
                WHERE c.conrelid IN (
                    to_regclass(format('%I.customer_consents', schema_name)),
                    to_regclass(format('%I.consent_events', schema_name))
                )
                AND c.conname IN ('customer_consents_purpose_check', 'consent_events_purpose_check')
            ) THEN
                RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: legacy purpose CHECK remains after WhatsApp v2';
            END IF;
        END IF;
    END IF;

    RAISE NOTICE 'V18_SCHEMA_PREFLIGHT=PASS; base_migration=%; whatsapp_migration=%; consent_tables=%; schema=%',
        base_count, whatsapp_count, table_count, schema_name;
    RAISE NOTICE 'LIMIT: metadata consistency only; sanitized production-like migration rehearsal remains mandatory';
END
$v18_schema_preflight$ LANGUAGE plpgsql;

ROLLBACK;
