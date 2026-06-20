import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Re-rotates test.admin@ to a fresh known password for the 2026-06-20 admin
 * full-flow verification pass on prod (the 1761100000000 plaintext was
 * scrubbed after the staff-flow audit). Test infra only; bcrypt hash embedded,
 * plaintext held outside the repo. Idempotent UPDATE by email; down() is a
 * no-op (throwaway test login).
 */
export class ResetTestAdminPasswordAgain1761130000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "users" SET "password" = $2::text, "updatedAt" = now()
             WHERE "email" = $1::text`,
            [
                'test.admin@salon-bw.pl',
                '$2b$10$tFxHXCaWhDEx7XM48U0g4.88.Tnxc9LK95MSk1IAghvCRL37b1st6',
            ],
        );
    }

    public async down(): Promise<void> {
        // Throwaway test login; nothing to restore.
    }
}
