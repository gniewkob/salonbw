import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dedicated EMPLOYEE-role test account, created at the owner's explicit
 * request (2026-06-23) so the restricted staff view can be exercised — the
 * only real staff member (Aleksandra, id 29) is an admin, so there was no
 * way to log in as a plain employee and confirm the role-gated UI (no
 * settings / statistics / employee-params, "Mój grafik", own-appointment
 * scope, etc.).
 *
 * Password is held outside the repo; only the bcrypt hash is embedded
 * (plaintext was handed to the owner in chat). The role column is the native
 * pg enum `users_role_enum`, so the value must be cast explicitly.
 *
 * Idempotent: inserted only if the email is absent. `down()` removes it.
 * Delete after testing — in the panel or by reverting this migration.
 */
const EMPLOYEE_TEST = {
    email: 'test.pracownik@salon-bw.pl',
    name: 'Pracownik (test)',
    role: 'employee' as const,
    hash: '$2b$10$lNFjpjwdwuAQ.zw4RNHDduyNV5OFMlj3a9NikG4z4MKNTSbcqvaPW',
};

export class CreateEmployeeTestAccount1761220000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "users"
               ("email", "name", "password", "role", "gdprConsent",
                "receiveNotifications", "createdAt", "updatedAt")
             SELECT $1::text, $2::text, $3::text, $4::"users_role_enum", true, true, now(), now()
             WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = $1::text)`,
            [
                EMPLOYEE_TEST.email,
                EMPLOYEE_TEST.name,
                EMPLOYEE_TEST.hash,
                EMPLOYEE_TEST.role,
            ],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "users" WHERE "email" = $1::text`,
            [EMPLOYEE_TEST.email],
        );
    }
}
