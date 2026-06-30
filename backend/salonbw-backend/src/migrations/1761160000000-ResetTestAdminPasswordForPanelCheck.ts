import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Re-rotates test.admin@ for the 2026-06-20 panel statistics live check
 * (previous plaintext scrubbed). Test infra only; bcrypt hash embedded,
 * plaintext out-of-repo. Idempotent UPDATE by email; down() is a no-op.
 */
export class ResetTestAdminPasswordForPanelCheck1761160000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "users" SET "password" = $2::text, "updatedAt" = now()
             WHERE "email" = $1::text`,
            [
                'test.admin@salon-bw.pl',
                '$2b$10$OAE1qrIe34/vJRw0dcbXseuAXPNMjB1p8131FhDKcrpJS3PeBO05C',
            ],
        );
    }

    public async down(): Promise<void> {
        // Throwaway test login; nothing to restore.
    }
}
