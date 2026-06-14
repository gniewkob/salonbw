import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TEMPORARY E2E test accounts (admin + employee) for the 2026-06-14 booking
 * flow verification. Created at the owner's explicit request to drive the
 * confirm/finalize path that public registration (Client-only) cannot reach.
 *
 * Passwords are random and held outside the repo; only bcrypt hashes are
 * embedded. These accounts should be DELETED after acceptance — `down()`
 * removes them, or delete `e2e.admin@` / `e2e.employee@` in the panel.
 *
 * Idempotent: inserted only if the email is absent.
 */
const E2E_USERS: Array<{
    email: string;
    name: string;
    role: 'admin' | 'employee';
    hash: string;
}> = [
    {
        email: 'e2e.admin@salon-bw.pl',
        name: 'E2E TEST Admin',
        role: 'admin',
        hash: '$2b$10$iJ.HbD9vXnyo3PU3qPuamunxMIIWHXFIYs1IYUvWSZqdSPLYkYGmW',
    },
    {
        email: 'e2e.employee@salon-bw.pl',
        name: 'E2E TEST Pracownik',
        role: 'employee',
        hash: '$2b$10$l57s9igcBMTrOdgjWFg0Ie8cXWKldbBEZcfjx2kw53RusqgYARufG',
    },
];

export class CreateE2eTestAccounts1761010000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const u of E2E_USERS) {
            await queryRunner.query(
                `INSERT INTO "users"
                   ("email", "name", "password", "role", "gdprConsent",
                    "receiveNotifications", "createdAt", "updatedAt")
                 SELECT $1::text, $2::text, $3::text, $4::"users_role_enum", true, true, now(), now()
                 WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = $1::text)`,
                [u.email, u.name, u.hash, u.role],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const emails = E2E_USERS.map((u) => u.email);
        await queryRunner.query(
            `DELETE FROM "users" WHERE "email" = ANY($1::text[])`,
            [emails],
        );
    }
}
