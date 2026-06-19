import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Resets the passwords of the kept test accounts (test.admin@ / test.ola@)
 * to a fresh known value for a 2026-06-19 staff-flow verification pass on
 * prod (the original random passwords from 1761050000000 are out-of-repo).
 *
 * These are test accounts kept on purpose (the "active test trio" the
 * CleanupTestQaAccounts migration preserves), so rotating their password is
 * test infra, not a user-data change. Only bcrypt hashes are embedded; the
 * plaintext is held outside the repo. Idempotent (UPDATE by email; no-op if
 * the account is absent). down() is a no-op — old random passwords aren't
 * recoverable and these are throwaway test logins anyway.
 */
const RESETS: Array<{ email: string; hash: string }> = [
    {
        email: 'test.admin@salon-bw.pl',
        hash: '$2b$10$JRgvf/wB6SmCbNJqSeNIg.eiderR6dr.NqcV6Js/IZqWhGBkpyQGW',
    },
    {
        email: 'test.ola@salon-bw.pl',
        hash: '$2b$10$IyZ1s9hQtlLdfDzlWDBy/OtC/37TVfvgRAvUXGxr0ropK8.8wfc0O',
    },
];

export class ResetTestAccountPasswords1761100000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const r of RESETS) {
            await queryRunner.query(
                `UPDATE "users" SET "password" = $2::text, "updatedAt" = now()
                 WHERE "email" = $1::text`,
                [r.email, r.hash],
            );
        }
    }

    public async down(): Promise<void> {
        // Throwaway test logins; nothing to restore.
    }
}
