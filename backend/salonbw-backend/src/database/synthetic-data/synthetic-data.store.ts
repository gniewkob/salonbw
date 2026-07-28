import type { QueryRunner } from 'typeorm';
import type {
    SyntheticDataset,
    SyntheticPlan,
    SyntheticVerificationExpected,
    SyntheticVerificationReport,
} from './synthetic-data.types';

export const RESET_GROUPS = {
    appointmentChildren: [
        'appointment_messages',
        'chat_messages',
        'sms_logs',
        'formulas',
        'invoices',
        'commissions',
        'reviews',
    ],
    customerChildren: [
        'customer_group_members',
        'customer_tag_assignments',
        'customer_notes',
        'customer_files',
        'customer_gallery_images',
        'loyalty_transactions',
        'loyalty_balances',
        'newsletter_recipients',
        'push_subscriptions',
    ],
    customerParents: [
        'customer_groups',
        'customer_tags',
        'customer_origins',
    ],
    warehouseChildren: [
        'service_recipe_items',
        'warehouse_sale_items',
        'warehouse_sales',
        'warehouse_usage_items',
        'warehouse_usages',
        'warehouse_order_items',
        'warehouse_orders',
        'stocktaking_items',
        'product_movements',
        'inventory_movements',
        'delivery_items',
        'deliveries',
    ],
    warehouseParents: [
        'stocktakings',
        'products',
        'product_categories',
        'suppliers',
    ],
} as const;

interface ProtectedUserRow {
    id: number;
    role: string;
}

interface IdRow {
    id: number;
}

interface CountRow {
    clients?: string | number;
    appointments?: string | number;
    products?: string | number;
    warehouseDocuments?: string | number;
    unprotectedPrivileged?: string | number;
}

interface VerificationRow extends CountRow {
    protectedAccountsPresent?: string | number;
    remainingNonSyntheticClients?: string | number;
}

interface ForeignKeyRow {
    childTable: string;
    parentTable: string;
}

const ALLOWED_TARGET_REFERENCES = new Set([
    'appointment_messages->appointments',
    'appointment_messages->users',
    'appointments->users',
    'automatic_message_rules->users',
    'branch_members->users',
    'branches->users',
    'chat_messages->users',
    'chat_messages->appointments',
    'commission_rules->users',
    'commissions->appointments',
    'commissions->products',
    'commissions->users',
    'customer_files->users',
    'customer_gallery_images->users',
    'customer_group_members->users',
    'customer_notes->users',
    'customer_tag_assignments->users',
    'deliveries->users',
    'delivery_items->products',
    'email_logs->users',
    'employee_services->users',
    'formulas->appointments',
    'formulas->users',
    'gift_card_transactions->users',
    'gift_cards->users',
    'invoices->appointments',
    'invoices->users',
    'loyalty_balances->users',
    'loyalty_reward_redemptions->users',
    'loyalty_transactions->users',
    'logs->users',
    'newsletter_recipients->users',
    'newsletters->users',
    'product_commission_rules->products',
    'product_commission_rules->users',
    'product_movements->products',
    'product_movements->users',
    'inventory_movements->products',
    'push_subscriptions->users',
    'refresh_tokens->users',
    'reviews->appointments',
    'reviews->users',
    'service_recipe_items->products',
    'service_reviews->users',
    'sms_logs->users',
    'sms_logs->appointments',
    'stocktaking_items->products',
    'stocktakings->users',
    'time_blocks->users',
    'timetable_exceptions->users',
    'timetables->users',
    'warehouse_order_items->products',
    'warehouse_orders->users',
    'warehouse_sale_items->products',
    'warehouse_sales->users',
    'warehouse_usage_items->products',
    'warehouse_usages->users',
]);

function asCount(value: string | number | undefined): number {
    const count = Number(value ?? 0);
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error('Database returned an invalid count');
    }
    return count;
}

export async function buildSyntheticPlan(
    queryRunner: QueryRunner,
    protectedEmails: string[],
    dataset: SyntheticDataset,
): Promise<SyntheticPlan> {
    const protectedUsers = (await queryRunner.query(
        `SELECT "id", "role"
         FROM "users"
         WHERE lower("email") = ANY($1::text[])
         ORDER BY "id"`,
        [protectedEmails],
    )) as ProtectedUserRow[];
    const services = (await queryRunner.query(
        `SELECT "id"
         FROM "services"
         ORDER BY "id"
         LIMIT 3`,
    )) as IdRow[];
    const [rawCounts = {}] = (await queryRunner.query(
        `SELECT
            (SELECT count(*) FROM "users"
             WHERE "role" = 'client' AND NOT ("id" = ANY($1::int[]))) AS "clients",
            (SELECT count(*) FROM "appointments") AS "appointments",
            (SELECT count(*) FROM "products") AS "products",
            ((SELECT count(*) FROM "deliveries")
             + (SELECT count(*) FROM "stocktakings")
             + (SELECT count(*) FROM "warehouse_orders")
             + (SELECT count(*) FROM "warehouse_sales")
             + (SELECT count(*) FROM "warehouse_usages")) AS "warehouseDocuments",
            (SELECT count(*) FROM "users"
             WHERE "role" IN ('admin', 'employee')
               AND NOT ("id" = ANY($1::int[]))) AS "unprotectedPrivileged"`,
        [protectedUsers.map((user) => user.id)],
    )) as CountRow[];

    const protectedAdmin = protectedUsers.find((user) => user.role === 'admin');
    const protectedClient = protectedUsers.find(
        (user) => user.role === 'client',
    );
    const serviceIds = services.map((service) => service.id);
    const blockers: string[] = [];

    if (protectedUsers.length !== protectedEmails.length) {
        blockers.push('One or more protected accounts are missing');
    }
    if (!protectedAdmin) {
        blockers.push('Protected admin account is missing');
    }
    if (!protectedClient) {
        blockers.push('Protected CI client account is missing');
    }
    if (serviceIds.length === 0) {
        blockers.push('No services are available for synthetic appointments');
    }
    if (asCount(rawCounts.unprotectedPrivileged) > 0) {
        blockers.push('Unprotected privileged accounts require review');
    }

    return {
        protectedUserIds: protectedUsers.map((user) => user.id),
        protectedAdminPresent: Boolean(protectedAdmin),
        protectedCiClientPresent: Boolean(protectedClient),
        ownerUserId: protectedAdmin?.id ?? null,
        serviceIds,
        deleteCounts: {
            clients: asCount(rawCounts.clients),
            appointments: asCount(rawCounts.appointments),
            products: asCount(rawCounts.products),
            warehouseDocuments: asCount(rawCounts.warehouseDocuments),
        },
        createCounts: {
            clients: dataset.clients.length,
            appointments: dataset.appointments.length,
            products: dataset.products.length,
            warehouseDocuments:
                dataset.deliveries.length +
                dataset.orders.length +
                dataset.sales.length +
                dataset.usages.length +
                dataset.stocktakings.length,
        },
        blockers,
    };
}

export function assertProtectedAccounts(plan: SyntheticPlan): void {
    if (plan.blockers.length > 0) {
        throw new Error(plan.blockers.join('; '));
    }
}

export async function assertResetSchema(
    queryRunner: QueryRunner,
): Promise<void> {
    const references = (await queryRunner.query(
        `SELECT
            tc.table_name AS "childTable",
            ccu.table_name AS "parentTable"
         FROM information_schema.table_constraints tc
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name
          AND ccu.constraint_schema = tc.constraint_schema
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_schema = current_schema()
           AND ccu.table_name = ANY($1::text[])
         ORDER BY tc.table_name, ccu.table_name`,
        [['users', 'appointments', 'products']],
    )) as ForeignKeyRow[];

    for (const reference of references) {
        const fingerprint = `${reference.childTable}->${reference.parentTable}`;
        if (!ALLOWED_TARGET_REFERENCES.has(fingerprint)) {
            throw new Error(
                `Unexpected foreign key: ${reference.childTable} -> ${reference.parentTable}`,
            );
        }
    }
}

export async function verifySyntheticState(
    queryRunner: QueryRunner,
    expected: SyntheticVerificationExpected,
    protectedUserIds: number[],
): Promise<SyntheticVerificationReport> {
    const [row = {}] = (await queryRunner.query(
        `SELECT
            (SELECT count(*) FROM "users"
             WHERE "role" = 'client'
               AND "email" LIKE 'synthetic.client.%@example.invalid')
                AS "clients",
            (SELECT count(*) FROM "appointments" a
             JOIN "users" u ON u."id" = a."clientId"
             WHERE u."email" LIKE 'synthetic.client.%@example.invalid')
                AS "appointments",
            (SELECT count(*) FROM "products"
             WHERE "sku" LIKE 'SYNTH-%') AS "products",
            ((SELECT count(*) FROM "deliveries"
              WHERE "deliveryNumber" LIKE 'SYNTHETIC-%')
             + (SELECT count(*) FROM "stocktakings"
                WHERE "stocktakingNumber" LIKE 'SYNTHETIC-%')
             + (SELECT count(*) FROM "warehouse_orders"
                WHERE "orderNumber" LIKE 'SYNTHETIC-%')
             + (SELECT count(*) FROM "warehouse_sales"
                WHERE "saleNumber" LIKE 'SYNTHETIC-%')
             + (SELECT count(*) FROM "warehouse_usages"
                WHERE "usageNumber" LIKE 'SYNTHETIC-%'))
                AS "warehouseDocuments",
            (SELECT count(*) FROM "users"
             WHERE "id" = ANY($1::int[])) AS "protectedAccountsPresent",
            (SELECT count(*) FROM "users"
             WHERE "role" = 'client'
               AND NOT ("id" = ANY($1::int[]))
               AND "email" NOT LIKE 'synthetic.client.%@example.invalid')
                AS "remainingNonSyntheticClients"`,
        [protectedUserIds],
    )) as VerificationRow[];

    const actual = {
        clients: asCount(row.clients),
        appointments: asCount(row.appointments),
        products: asCount(row.products),
        warehouseDocuments: asCount(row.warehouseDocuments),
    };
    const protectedAccountsPresent = asCount(row.protectedAccountsPresent);
    const remainingNonSyntheticClients = asCount(
        row.remainingNonSyntheticClients,
    );
    const blockers: string[] = [];

    for (const key of Object.keys(expected) as Array<
        keyof SyntheticVerificationExpected
    >) {
        if (actual[key] !== expected[key]) {
            blockers.push(
                `${key} count mismatch: expected ${expected[key]}, got ${actual[key]}`,
            );
        }
    }
    if (protectedAccountsPresent !== protectedUserIds.length) {
        blockers.push('One or more protected accounts are missing');
    }
    if (remainingNonSyntheticClients > 0) {
        blockers.push('Non-synthetic client accounts remain');
    }

    return {
        actual,
        expected,
        protectedAccountsPresent,
        remainingNonSyntheticClients,
        blockers,
    };
}

async function deleteAllRows(
    queryRunner: QueryRunner,
    table: string,
): Promise<number> {
    const [result = {}] = (await queryRunner.query(
        `WITH deleted AS (
            DELETE FROM "${table}"
            RETURNING 1
         )
         SELECT count(*)::int AS "count" FROM deleted`,
    )) as Array<{ count?: string | number }>;
    return asCount(result.count);
}

export async function resetOperationalData(
    queryRunner: QueryRunner,
    protectedUserIds: number[],
): Promise<Record<string, number>> {
    if (protectedUserIds.length === 0) {
        throw new Error('Protected user ids are required');
    }

    const counts: Record<string, number> = {};
    const deleteGroup = async (tables: readonly string[]) => {
        for (const table of tables) {
            counts[table] = await deleteAllRows(queryRunner, table);
        }
    };

    await deleteGroup(RESET_GROUPS.appointmentChildren);
    counts.appointments = await deleteAllRows(queryRunner, 'appointments');
    await deleteGroup(RESET_GROUPS.customerChildren);
    await deleteGroup(RESET_GROUPS.customerParents);
    await deleteGroup(RESET_GROUPS.warehouseChildren);
    await deleteGroup(RESET_GROUPS.warehouseParents);

    const [usersResult = {}] = (await queryRunner.query(
        `WITH deleted AS (
            DELETE FROM "users"
            WHERE "role" = 'client'
              AND NOT ("id" = ANY($1::int[]))
            RETURNING 1
         )
         SELECT count(*)::int AS "count" FROM deleted`,
        [protectedUserIds],
    )) as Array<{ count?: string | number }>;
    counts.users = asCount(usersResult.count);

    return counts;
}

export async function cleanupSyntheticData(
    queryRunner: QueryRunner,
): Promise<Record<string, number>> {
    const statements = [
        {
            name: 'appointment_messages',
            sql: `DELETE FROM "appointment_messages" child
                  USING "appointments" appointment, "users" client
                  WHERE child."appointmentId" = appointment."id"
                    AND appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'chat_messages',
            sql: `DELETE FROM "chat_messages" child
                  USING "appointments" appointment, "users" client
                  WHERE child."appointmentId" = appointment."id"
                    AND appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'sms_logs',
            sql: `DELETE FROM "sms_logs" child
                  USING "appointments" appointment, "users" client
                  WHERE child."appointmentId" = appointment."id"
                    AND appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'formulas',
            sql: `DELETE FROM "formulas" child
                  USING "users" client
                  WHERE child."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'invoices',
            sql: `DELETE FROM "invoices" child
                  USING "users" client
                  WHERE child."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'commissions',
            sql: `DELETE FROM "commissions" child
                  USING "appointments" appointment, "users" client
                  WHERE child."appointmentId" = appointment."id"
                    AND appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'reviews',
            sql: `DELETE FROM "reviews" child
                  USING "appointments" appointment, "users" client
                  WHERE child."appointmentId" = appointment."id"
                    AND appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'appointments',
            sql: `DELETE FROM "appointments" appointment
                  USING "users" client
                  WHERE appointment."clientId" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'loyalty_transactions',
            sql: `DELETE FROM "loyalty_transactions" child
                  USING "users" client
                  WHERE child."user_id" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'loyalty_balances',
            sql: `DELETE FROM "loyalty_balances" child
                  USING "users" client
                  WHERE child."user_id" = client."id"
                    AND client."email" LIKE 'synthetic.client.%@example.invalid'`,
        },
        {
            name: 'delivery_items',
            sql: `DELETE FROM "delivery_items" child
                  USING "deliveries" document
                  WHERE child."deliveryId" = document."id"
                    AND document."deliveryNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'deliveries',
            sql: `DELETE FROM "deliveries"
                  WHERE "deliveryNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_order_items',
            sql: `DELETE FROM "warehouse_order_items" child
                  USING "warehouse_orders" document
                  WHERE child."orderId" = document."id"
                    AND document."orderNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_orders',
            sql: `DELETE FROM "warehouse_orders"
                  WHERE "orderNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_sale_items',
            sql: `DELETE FROM "warehouse_sale_items" child
                  USING "warehouse_sales" document
                  WHERE child."saleId" = document."id"
                    AND document."saleNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_sales',
            sql: `DELETE FROM "warehouse_sales"
                  WHERE "saleNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_usage_items',
            sql: `DELETE FROM "warehouse_usage_items" child
                  USING "warehouse_usages" document
                  WHERE child."usageId" = document."id"
                    AND document."usageNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'warehouse_usages',
            sql: `DELETE FROM "warehouse_usages"
                  WHERE "usageNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'stocktaking_items',
            sql: `DELETE FROM "stocktaking_items" child
                  USING "stocktakings" document
                  WHERE child."stocktakingId" = document."id"
                    AND document."stocktakingNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'stocktakings',
            sql: `DELETE FROM "stocktakings"
                  WHERE "stocktakingNumber" LIKE 'SYNTHETIC-%'`,
        },
        {
            name: 'service_recipe_items',
            sql: `DELETE FROM "service_recipe_items" child
                  USING "products" product
                  WHERE child."productId" = product."id"
                    AND product."sku" LIKE 'SYNTH-%'`,
        },
        {
            name: 'product_movements',
            sql: `DELETE FROM "product_movements" child
                  USING "products" product
                  WHERE child."productId" = product."id"
                    AND product."sku" LIKE 'SYNTH-%'`,
        },
        {
            name: 'products',
            sql: `DELETE FROM "products" WHERE "sku" LIKE 'SYNTH-%'`,
        },
        {
            name: 'product_categories',
            sql: `DELETE FROM "product_categories"
                  WHERE "name" LIKE 'SYNTHETIC %'`,
        },
        {
            name: 'suppliers',
            sql: `DELETE FROM "suppliers"
                  WHERE "name" LIKE 'SYNTHETIC %'`,
        },
        {
            name: 'users',
            sql: `DELETE FROM "users"
                  WHERE "role" = 'client'
                    AND "email" LIKE 'synthetic.client.%@example.invalid'`,
        },
    ] as const;
    const counts: Record<string, number> = {};

    for (const statement of statements) {
        const [row = {}] = (await queryRunner.query(
            `WITH deleted AS (
                ${statement.sql}
                RETURNING 1
             )
             SELECT count(*)::int AS "count" FROM deleted`,
        )) as Array<{ count?: string | number }>;
        counts[statement.name] = asCount(row.count);
    }

    return counts;
}

interface SyntheticInsertContext {
    ownerUserId: number;
    clientPasswordHash: string;
}

async function insertReturningId(
    queryRunner: QueryRunner,
    sql: string,
    parameters: unknown[],
): Promise<number> {
    const [row] = (await queryRunner.query(sql, parameters)) as Array<{
        id?: number;
    }>;
    if (!Number.isSafeInteger(row?.id) || Number(row.id) <= 0) {
        throw new Error('Synthetic insert did not return a valid id');
    }
    return Number(row.id);
}

export async function insertSyntheticDataset(
    queryRunner: QueryRunner,
    dataset: SyntheticDataset,
    context: SyntheticInsertContext,
): Promise<Record<string, number>> {
    const clientIds = new Map<string, number>();
    const categoryIds = new Map<string, number>();
    const supplierIds = new Map<string, number>();
    const productIds = new Map<string, number>();
    const appointmentIds = new Map<string, number>();

    for (const client of dataset.clients) {
        const id = await insertReturningId(
            queryRunner,
            `INSERT INTO "users"
                ("email", "password", "name", "role", "phone",
                 "receiveNotifications", "firstName", "lastName",
                 "notifyPanel", "smsConsent", "whatsappConsent",
                 "emailConsent", "gdprConsent", "termsConsent",
                 "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'client', NULL, false, $4, $5,
                     true, false, false, false, false, false, now(), now())
             RETURNING "id"`,
            [
                client.email,
                context.clientPasswordHash,
                client.name,
                client.firstName,
                client.lastName,
            ],
        );
        clientIds.set(client.key, id);
    }

    for (const category of dataset.productCategories) {
        const id = await insertReturningId(
            queryRunner,
            `INSERT INTO "product_categories"
                ("name", "sortOrder", "isActive", "createdAt", "updatedAt")
             VALUES ($1, $2, true, now(), now())
             RETURNING "id"`,
            [category.name, categoryIds.size],
        );
        categoryIds.set(category.key, id);
    }

    for (const supplier of dataset.suppliers) {
        const id = await insertReturningId(
            queryRunner,
            `INSERT INTO "suppliers"
                ("name", "email", "notes", "isActive", "createdAt", "updatedAt")
             VALUES ($1, $2, 'SYNTHETIC pre-live', true, now(), now())
             RETURNING "id"`,
            [supplier.name, supplier.email],
        );
        supplierIds.set(supplier.key, id);
    }

    for (const product of dataset.products) {
        const id = await insertReturningId(
            queryRunner,
            `INSERT INTO "products"
                ("name", "brand", "description", "sku", "productType",
                 "unitPrice", "vatRate", "purchasePrice", "stock",
                 "minQuantity", "unit", "defaultSupplierId", "categoryId",
                 "isActive", "trackStock", "createdAt", "updatedAt")
             VALUES ($1, $2, 'SYNTHETIC pre-live', $3, 'product',
                     $4, 23, $5, $6, $7, $8, $9, $10,
                     true, true, now(), now())
             RETURNING "id"`,
            [
                product.name,
                product.brand,
                product.sku,
                product.unitPrice,
                product.purchasePrice,
                product.stock,
                product.minQuantity,
                product.unit,
                supplierIds.get(product.supplierKey),
                categoryIds.get(product.categoryKey),
            ],
        );
        productIds.set(product.key, id);
    }

    for (const appointment of dataset.appointments) {
        const clientId = clientIds.get(appointment.clientKey);
        if (!clientId) {
            throw new Error('Synthetic appointment references unknown client');
        }
        const id = await insertReturningId(
            queryRunner,
            `INSERT INTO "appointments"
                ("clientId", "employeeId", "serviceId", "startTime",
                 "endTime", "status", "paymentMethod", "paidAmount",
                 "tipAmount", "reservedOnline", "reminderSent",
                 "clientComment", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
                     $10, false, 'SYNTHETIC pre-live', now(), now())
             RETURNING "id"`,
            [
                clientId,
                context.ownerUserId,
                appointment.serviceId,
                appointment.startTime,
                appointment.endTime,
                appointment.status,
                appointment.paymentMethod,
                appointment.paidAmount,
                appointment.tipAmount,
                appointment.status === 'online_pending',
            ],
        );
        appointmentIds.set(appointment.key, id);
    }

    for (const commission of dataset.commissions) {
        await queryRunner.query(
            `INSERT INTO "commissions"
                ("employeeId", "appointmentId", "amount", "percent", "createdAt")
             VALUES ($1, $2, $3, $4, now())`,
            [
                commission.employeeId,
                appointmentIds.get(commission.appointmentKey),
                commission.amount,
                commission.percent,
            ],
        );
    }

    for (const review of dataset.reviews) {
        await queryRunner.query(
            `INSERT INTO "reviews"
                ("clientId", "employeeId", "appointmentId",
                 "rating", "comment", "createdAt")
             VALUES ($1, $2, $3, $4, $5, now())`,
            [
                clientIds.get(review.clientKey),
                context.ownerUserId,
                appointmentIds.get(review.appointmentKey),
                review.rating,
                review.comment,
            ],
        );
    }

    const loyaltyBalances = new Map<
        string,
        { balance: number; earned: number; spent: number }
    >();
    for (const transaction of dataset.loyaltyTransactions) {
        const previous = loyaltyBalances.get(transaction.clientKey) ?? {
            balance: 0,
            earned: 0,
            spent: 0,
        };
        const points =
            transaction.type === 'redeemed'
                ? -transaction.points
                : transaction.points;
        const balanceAfter = previous.balance + points;
        loyaltyBalances.set(transaction.clientKey, {
            balance: balanceAfter,
            earned:
                previous.earned +
                (transaction.type === 'earned' ? transaction.points : 0),
            spent:
                previous.spent +
                (transaction.type === 'redeemed' ? transaction.points : 0),
        });
        await queryRunner.query(
            `INSERT INTO "loyalty_transactions"
                ("user_id", "type", "source", "points", "points_remaining",
                 "balance_after", "description", "performed_by_id",
                 "is_expired", "created_at")
             VALUES ($1, $2, 'manual', $3, $4, $4,
                     'SYNTHETIC pre-live', $5, false, now())`,
            [
                clientIds.get(transaction.clientKey),
                transaction.type === 'redeemed' ? 'spend' : 'earn',
                points,
                balanceAfter,
                context.ownerUserId,
            ],
        );
    }
    for (const [clientKey, totals] of loyaltyBalances) {
        await queryRunner.query(
            `INSERT INTO "loyalty_balances"
                ("user_id", "total_points_earned", "total_points_spent",
                 "current_balance", "lifetime_tier_points",
                 "created_at", "updated_at")
             VALUES ($1, $2, $3, $4, $2, now(), now())`,
            [
                clientIds.get(clientKey),
                totals.earned,
                totals.spent,
                totals.balance,
            ],
        );
    }

    const delivery = dataset.deliveries[0];
    const deliveryId = await insertReturningId(
        queryRunner,
        `INSERT INTO "deliveries"
            ("deliveryNumber", "supplierId", "status", "deliveryDate",
             "receivedDate", "totalCost", "notes", "receivedById",
             "createdAt", "updatedAt")
         VALUES ($1, $2, 'received', $3, $3, 36,
                 'SYNTHETIC pre-live', $4, now(), now())
         RETURNING "id"`,
        [
            delivery.number,
            supplierIds.get('supplier-1'),
            dataset.anchorDate,
            context.ownerUserId,
        ],
    );
    for (const key of delivery.productKeys) {
        await queryRunner.query(
            `INSERT INTO "delivery_items"
                ("deliveryId", "productId", "quantity", "unitCost", "totalCost")
             VALUES ($1, $2, 1, 12, 12)`,
            [deliveryId, productIds.get(key)],
        );
    }

    const order = dataset.orders[0];
    const orderId = await insertReturningId(
        queryRunner,
        `INSERT INTO "warehouse_orders"
            ("orderNumber", "supplierId", "status", "sentAt", "notes",
             "createdById", "createdAt", "updatedAt")
         VALUES ($1, $2, 'sent', $3, 'SYNTHETIC pre-live', $4, now(), now())
         RETURNING "id"`,
        [
            order.number,
            supplierIds.get('supplier-2'),
            dataset.anchorDate,
            context.ownerUserId,
        ],
    );
    for (const key of order.productKeys) {
        const product = dataset.products.find((item) => item.key === key);
        await queryRunner.query(
            `INSERT INTO "warehouse_order_items"
                ("orderId", "productId", "productName", "quantity",
                 "unit", "receivedQuantity", "createdAt")
             VALUES ($1, $2, $3, 1, $4, 0, now())`,
            [orderId, productIds.get(key), product?.name, product?.unit],
        );
    }

    const sale = dataset.sales[0];
    const saleId = await insertReturningId(
        queryRunner,
        `INSERT INTO "warehouse_sales"
            ("saleNumber", "soldAt", "clientName", "clientId", "employeeId",
             "kind", "status", "discountGross", "totalNet", "totalGross",
             "paymentMethod", "notes", "createdById", "createdAt", "updatedAt")
         VALUES ($1, $2, 'SYNTHETIC Klient 01', $3, $4, 'sale', 'active',
                 0, 20, 24.60, 'card', 'SYNTHETIC pre-live', $4, now(), now())
         RETURNING "id"`,
        [
            sale.number,
            dataset.anchorDate,
            clientIds.get('client-01'),
            context.ownerUserId,
        ],
    );
    for (const key of sale.productKeys) {
        const product = dataset.products.find((item) => item.key === key);
        await queryRunner.query(
            `INSERT INTO "warehouse_sale_items"
                ("saleId", "productId", "productName", "quantity", "unit",
                 "unitPriceNet", "unitPriceGross", "vatRate", "discountGross",
                 "totalNet", "totalGross", "createdAt")
             VALUES ($1, $2, $3, 1, $4, 20, 24.60, 23, 0, 20, 24.60, now())`,
            [saleId, productIds.get(key), product?.name, product?.unit],
        );
    }

    const usage = dataset.usages[0];
    const usageId = await insertReturningId(
        queryRunner,
        `INSERT INTO "warehouse_usages"
            ("usageNumber", "usedAt", "clientName", "clientId", "employeeId",
             "notes", "createdById", "createdAt", "updatedAt")
         VALUES ($1, $2, 'SYNTHETIC Klient 02', $3, $4,
                 'SYNTHETIC pre-live', $4, now(), now())
         RETURNING "id"`,
        [
            usage.number,
            dataset.anchorDate,
            clientIds.get('client-02'),
            context.ownerUserId,
        ],
    );
    for (const key of usage.productKeys) {
        const product = dataset.products.find((item) => item.key === key);
        await queryRunner.query(
            `INSERT INTO "warehouse_usage_items"
                ("usageId", "productId", "productName", "quantity", "unit",
                 "stockBefore", "stockAfter", "createdAt")
             VALUES ($1, $2, $3, 1, $4, $5, $6, now())`,
            [
                usageId,
                productIds.get(key),
                product?.name,
                product?.unit,
                product?.stock,
                Math.max((product?.stock ?? 1) - 1, 0),
            ],
        );
    }

    const stocktaking = dataset.stocktakings[0];
    const stocktakingId = await insertReturningId(
        queryRunner,
        `INSERT INTO "stocktakings"
            ("stocktakingNumber", "status", "stocktakingDate", "notes",
             "createdById", "completedById", "completedAt",
             "createdAt", "updatedAt")
         VALUES ($1, 'completed', $2, 'SYNTHETIC pre-live',
                 $3, $3, $2, now(), now())
         RETURNING "id"`,
        [stocktaking.number, dataset.anchorDate, context.ownerUserId],
    );
    for (const product of dataset.products) {
        await queryRunner.query(
            `INSERT INTO "stocktaking_items"
                ("stocktakingId", "productId", "systemQuantity",
                 "countedQuantity", "difference", "notes")
             VALUES ($1, $2, $3, $3, 0, 'SYNTHETIC pre-live')`,
            [stocktakingId, productIds.get(product.key), product.stock],
        );
    }

    for (const item of dataset.recipeItems) {
        await queryRunner.query(
            `INSERT INTO "service_recipe_items"
                ("serviceId", "productId", "quantity", "unit",
                 "notes", "createdAt")
             VALUES ($1, $2, $3, $4, 'SYNTHETIC pre-live', now())`,
            [
                item.serviceId,
                productIds.get(item.productKey),
                item.quantity,
                item.unit,
            ],
        );
    }

    return {
        clients: dataset.clients.length,
        appointments: dataset.appointments.length,
        productCategories: dataset.productCategories.length,
        products: dataset.products.length,
        suppliers: dataset.suppliers.length,
        warehouseDocuments:
            dataset.deliveries.length +
            dataset.orders.length +
            dataset.sales.length +
            dataset.usages.length +
            dataset.stocktakings.length,
        commissions: dataset.commissions.length,
        reviews: dataset.reviews.length,
        loyaltyTransactions: dataset.loyaltyTransactions.length,
        recipeItems: dataset.recipeItems.length,
    };
}
