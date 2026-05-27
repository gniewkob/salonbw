import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReceptionistRoleToUsersEnum1760970000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "users_role_enum"
            ADD VALUE IF NOT EXISTS 'receptionist'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM "users"
                    WHERE "role"::text = 'receptionist'
                ) THEN
                    RAISE EXCEPTION 'Cannot downgrade: users.role contains receptionist values';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TYPE "users_role_enum"
            RENAME TO "users_role_enum_old"
        `);

        await queryRunner.query(`
            CREATE TYPE "users_role_enum"
            AS ENUM ('client', 'employee', 'admin')
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" TYPE "users_role_enum"
            USING "role"::text::"users_role_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" SET DEFAULT 'client'
        `);

        await queryRunner.query(`
            DROP TYPE "users_role_enum_old"
        `);
    }
}
