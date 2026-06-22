import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gives the salon owner a real admin login (owner-authorised 2026-06-22).
 * Aleksandra (id 29) was an `employee` with a placeholder `…@local.invalid`
 * email and no usable password, while the only admin was a throwaway
 * "Test Admin" account. This sets her account to:
 *   - email   = kontakt@salon-bw.pl  (her login)
 *   - role    = admin                (native users_role_enum)
 *   - password = a TEMPORARY bcrypt hash; she must change it on first login
 *                via Konto → Zmień hasło. The plaintext is NOT stored here.
 * The test accounts (Ola/Test Admin) are removed in a follow-up migration
 * only AFTER the owner confirms this admin login works — so a working admin
 * always exists.
 *
 * `users.role` is a native pg enum in prod, so the cast is required.
 * Aborts if kontakt@salon-bw.pl is already used by another account.
 */
export class PromoteAleksandraToAdmin1761200000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const conflict: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM "users" WHERE email = $1 AND id <> 29`,
            ['kontakt@salon-bw.pl'],
        );
        if (conflict.length > 0) {
            throw new Error(
                `kontakt@salon-bw.pl is already used by user id ${conflict[0].id}; resolve before promoting Aleksandra.`,
            );
        }
        await queryRunner.query(
            `UPDATE "users"
             SET email = $1,
                 role = 'admin'::"users_role_enum",
                 password = $2
             WHERE id = 29`,
            [
                'kontakt@salon-bw.pl',
                '$2b$10$u9WYla1DPjMdHjZTU0tyy..ORtNz/ZrB0TWlwK6GOhnAoNUD2T.aG',
            ],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Demote role back to employee; email/password are not restored.
        await queryRunner.query(
            `UPDATE "users" SET role = 'employee'::"users_role_enum" WHERE id = 29`,
        );
    }
}
