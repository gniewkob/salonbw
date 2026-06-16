import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Test accounts (2026-06-16) for trying the role model end-to-end:
 *   - test.admin@   → admin    (full access)
 *   - test.ola@     → employee (stylist; tests the restricted-employee UX +
 *                     the new "Mój grafik" self-service schedule)
 *   - test.klient@  → client   (online booking only)
 * Random passwords held outside the repo; only bcrypt hashes embedded.
 * Idempotent (by email). Remove after testing (delete in panel or revert).
 */
const TEST_USERS: Array<{
    email: string;
    name: string;
    role: 'admin' | 'employee' | 'client';
    hash: string;
}> = [
    {
        email: 'test.admin@salon-bw.pl',
        name: 'Test Admin',
        role: 'admin',
        hash: '$2b$10$YzEwQ/otX56zmtPn9oW/Su8p78yEVY1Kobyl96kLkYGTZ7pDwkk2a',
    },
    {
        email: 'test.ola@salon-bw.pl',
        name: 'Ola (test)',
        role: 'employee',
        hash: '$2b$10$begj7U1COVPxTxKHGHIyWOCGxRW8AxfnOosVkk9mTNDEArjHn4qci',
    },
    {
        email: 'test.klient@salon-bw.pl',
        name: 'Test Klient',
        role: 'client',
        hash: '$2b$10$Q/cbTpxiRhWqQQUTIcTmw.Ae9WNcK7CUM/R4RnGcfvOnskgENnV/G',
    },
];

export class CreateTestAccounts1761050000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const u of TEST_USERS) {
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
        await queryRunner.query(
            `DELETE FROM "users" WHERE "email" = ANY($1::text[])`,
            [TEST_USERS.map((u) => u.email)],
        );
    }
}
