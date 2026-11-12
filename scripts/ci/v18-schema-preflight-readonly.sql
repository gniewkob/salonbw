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
    expected_trigger_body text := $migration_function$
            BEGIN
                -- Allow only FK ON DELETE SET NULL side effects (actor or
                -- idempotency request removed); every audited value stays.
                IF (to_jsonb(NEW) - 'actor_id' - 'request_id')
                        = (to_jsonb(OLD) - 'actor_id' - 'request_id')
                   AND (NEW.actor_id IS NULL OR NEW.actor_id = OLD.actor_id)
                   AND (NEW.request_id IS NULL OR NEW.request_id = OLD.request_id)
                THEN
                    RETURN NEW;
                END IF;
                RAISE EXCEPTION 'consent_events is append-only';
            END;
            $migration_function$;
    purpose_check record;
    raw_expr text;
    actual_literals text[];
    expected_literals text[];
    actual_expr text;
    expected_expr text;
    base_count integer;
    whatsapp_count integer;
    table_count integer;
    fk_count integer;
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
        -- Check the complete runtime TypeORM column contract, not just identifiers.
        -- pg_catalog.format_type validates typmod (varchar length) as well as base type.
        -- This reads zero application rows.
        IF EXISTS (
            SELECT 1
            FROM (VALUES
                ('consent_requests', 'id', 'integer', true),
                ('consent_requests', 'customer_id', 'integer', true),
                ('consent_requests', 'idempotency_key', 'character varying(100)', true),
                ('consent_requests', 'payload_hash', 'character varying(64)', true),
                ('consent_requests', 'created_at', 'timestamp with time zone', true),
                ('customer_consents', 'id', 'integer', true),
                ('customer_consents', 'customer_id', 'integer', true),
                ('customer_consents', 'purpose', 'character varying(40)', true),
                ('customer_consents', 'channel', 'character varying(20)', true),
                ('customer_consents', 'status', 'character varying(20)', true),
                ('customer_consents', 'source', 'character varying(40)', true),
                ('customer_consents', 'actor_id', 'integer', false),
                ('customer_consents', 'actor_role', 'character varying(20)', true),
                ('customer_consents', 'recorded_at', 'timestamp with time zone', true),
                ('customer_consents', 'effective_at', 'timestamp with time zone', true),
                ('customer_consents', 'consent_text_version', 'character varying(80)', false),
                ('customer_consents', 'evidence_reference', 'character varying(500)', false),
                ('customer_consents', 'version', 'integer', true),
                ('communication_preferences', 'id', 'integer', true),
                ('communication_preferences', 'customer_id', 'integer', true),
                ('communication_preferences', 'communication_type', 'character varying(40)', true),
                ('communication_preferences', 'channel', 'character varying(20)', true),
                ('communication_preferences', 'enabled', 'boolean', true),
                ('communication_preferences', 'updated_at', 'timestamp with time zone', true),
                ('communication_preferences', 'updated_by_id', 'integer', false),
                ('communication_preferences', 'version', 'integer', true),
                ('consent_events', 'id', 'integer', true),
                ('consent_events', 'customer_id', 'integer', true),
                ('consent_events', 'actor_id', 'integer', false),
                ('consent_events', 'actor_role', 'character varying(20)', true),
                ('consent_events', 'source', 'character varying(40)', true),
                ('consent_events', 'purpose', 'character varying(40)', false),
                ('consent_events', 'communication_type', 'character varying(40)', false),
                ('consent_events', 'channel', 'character varying(20)', true),
                ('consent_events', 'event_type', 'character varying(30)', true),
                ('consent_events', 'previous_status', 'character varying(20)', false),
                ('consent_events', 'new_status', 'character varying(20)', true),
                ('consent_events', 'occurred_at', 'timestamp with time zone', true),
                ('consent_events', 'consent_text_version', 'character varying(80)', false),
                ('consent_events', 'evidence_reference', 'character varying(500)', false),
                ('consent_events', 'request_id', 'integer', false)
            ) AS required(tab, col, expected_type, required_not_null)
            WHERE NOT EXISTS (
                SELECT 1
                FROM pg_catalog.pg_attribute a
                WHERE a.attrelid = to_regclass(format('%I.%I', schema_name, required.tab))
                  AND a.attname = required.col
                  AND a.attnum > 0 AND NOT a.attisdropped
                  AND pg_catalog.format_type(a.atttypid, a.atttypmod) = required.expected_type
                  AND a.attnotnull = required.required_not_null
            )
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: runtime consent column/type/nullability mismatch';
        END IF;

        -- The second migration adds two nullable varchar(32) fields.
        -- Validate both type and nullable flag when present, and their absence otherwise.
        IF EXISTS (
            SELECT 1
            FROM (VALUES ('customer_consents'), ('consent_events')) AS x(tab)
            WHERE (whatsapp_count = 1 AND NOT EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a
                WHERE a.attrelid = to_regclass(format('%I.%I', schema_name, x.tab))
                  AND a.attname = 'contact_value'
                  AND a.attnum > 0 AND NOT a.attisdropped
                  AND pg_catalog.format_type(a.atttypid,a.atttypmod) = 'character varying(32)'
                  AND NOT a.attnotnull
            )) OR (whatsapp_count = 0 AND EXISTS (
                SELECT 1 FROM pg_catalog.pg_attribute a
                WHERE a.attrelid = to_regclass(format('%I.%I', schema_name, x.tab))
                  AND a.attname = 'contact_value'
                  AND a.attnum > 0 AND NOT a.attisdropped
            ))
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: WhatsApp contact column type/history mismatch';
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

        -- A same-named trigger can target INSERT or a no-op function.
        -- Require the exact BEFORE UPDATE FOR EACH ROW unrestricted contract,
        -- and the migration's PL/pgSQL body (whitespace-normalized).
        IF NOT EXISTS (
            SELECT 1 FROM pg_catalog.pg_trigger t
            JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
            JOIN pg_catalog.pg_namespace ns ON ns.oid = p.pronamespace
            WHERE t.tgrelid = to_regclass(format('%I.consent_events', schema_name))
              AND t.tgname = 'TRG_consent_events_append_only'
              AND t.tgenabled IN ('O', 'A') AND NOT t.tgisinternal
              AND t.tgtype = 19 -- row=1, before=2, update=16
              AND t.tgqual IS NULL AND t.tgattr::text = ''
              AND t.tgnargs = 0 AND t.tgconstraint = 0
              AND ns.nspname = schema_name AND p.pronargs = 0
              AND p.prorettype = 'pg_catalog.trigger'::regtype
              AND p.prolang = (SELECT oid FROM pg_catalog.pg_language WHERE lanname='plpgsql')
              AND NOT p.prosecdef
              AND regexp_replace(p.prosrc, '[[:space:]]+', '', 'g') =
                  regexp_replace(expected_trigger_body, '[[:space:]]+', '', 'g')
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: append-only audit trigger definition/body mismatch';
        END IF;
    END IF;

    IF base_count = 1 THEN
        -- Compare the full normalized CHECK AST render, not only its name.
        -- ANY ARRAY is PostgreSQL's canonical form for the migration's IN (...).
        -- Preserve the case-sensitive purpose string literals; normalize only
        -- whitespace/parentheses and catalog type casts. Match the exact set
        -- and presence/absence of IS NULL, without
        -- running writes or touching any customer row.
        FOR purpose_check IN
            SELECT x.tab, x.constraint_name
            FROM (VALUES
                ('customer_consents', CASE WHEN whatsapp_count = 1
                    THEN 'CHK_customer_consents_purpose_v2'
                    ELSE 'customer_consents_purpose_check' END),
                ('consent_events', CASE WHEN whatsapp_count = 1
                    THEN 'CHK_consent_events_purpose_v2'
                    ELSE 'consent_events_purpose_check' END)
            ) AS x(tab, constraint_name)
        LOOP
            SELECT pg_catalog.pg_get_expr(c.conbin, c.conrelid)
              INTO raw_expr
            FROM pg_catalog.pg_constraint c
            WHERE c.conrelid = to_regclass(format('%I.%I', schema_name, purpose_check.tab))
              AND c.conname = purpose_check.constraint_name
              AND c.contype = 'c'
              AND c.convalidated;

            -- Never normalize SQL string literals: their exact bytes determine
            -- whether PostgreSQL accepts the uppercase runtime purpose values.
            -- Before simplifying the surrounding AST syntax, compare all raw
            -- quoted literals in their original order, byte-for-byte.
            SELECT array_agg(m[1] ORDER BY ord)
              INTO actual_literals
            FROM regexp_matches(raw_expr, '''([^'']*)''', 'g')
                WITH ORDINALITY AS tokens(m, ord);

            expected_literals := ARRAY[
                'DIRECT_MARKETING', 'NEWSLETTER', 'REVIEW_REQUEST'
            ];
            IF whatsapp_count = 1 THEN
                expected_literals := array_append(
                    expected_literals, 'WHATSAPP_APPOINTMENT_UPDATES'
                );
            END IF;
            IF actual_literals IS DISTINCT FROM expected_literals THEN
                RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: purpose CHECK literal mismatch on %',
                    purpose_check.tab;
            END IF;

            -- Only after strict literal comparison may formatting/casts in
            -- pg_get_expr be simplified for exact operator-shape comparison.
            actual_expr := regexp_replace(
                regexp_replace(raw_expr, '[[:space:]()"]+', '', 'g'),
                '::(charactervarying|text)', '', 'g'
            );

            expected_expr :=
                CASE WHEN purpose_check.tab = 'consent_events'
                    THEN 'purposeISNULLOR' ELSE '' END ||
                'purpose=ANYARRAY[''DIRECT_MARKETING'',''NEWSLETTER'',''REVIEW_REQUEST''' ||
                CASE WHEN whatsapp_count = 1
                    THEN ',''WHATSAPP_APPOINTMENT_UPDATES''' ELSE '' END || '][]';

            IF actual_expr IS DISTINCT FROM expected_expr THEN
                RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: purpose CHECK expression mismatch on %',
                    purpose_check.tab;
            END IF;
        END LOOP;

        IF whatsapp_count = 1 AND EXISTS (
            SELECT 1 FROM pg_catalog.pg_constraint c
            WHERE c.conrelid IN (
                to_regclass(format('%I.customer_consents', schema_name)),
                to_regclass(format('%I.consent_events', schema_name))
            )
              AND c.conname IN (
                'customer_consents_purpose_check', 'consent_events_purpose_check'
              )
        ) THEN
            RAISE EXCEPTION 'V18_SCHEMA_BLOCKED: legacy purpose CHECK remains after WhatsApp v2';
        END IF;
    END IF;

    RAISE NOTICE 'V18_SCHEMA_PREFLIGHT=PASS; base_migration=%; whatsapp_migration=%; consent_tables=%; schema=%',
        base_count, whatsapp_count, table_count, schema_name;
    RAISE NOTICE 'LIMIT: metadata consistency only; sanitized production-like migration rehearsal remains mandatory';
END
$v18_schema_preflight$ LANGUAGE plpgsql;

ROLLBACK;
