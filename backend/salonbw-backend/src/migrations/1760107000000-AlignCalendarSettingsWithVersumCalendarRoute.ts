import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignCalendarSettingsWithVersumCalendarRoute1760107000000
    implements MigrationInterface
{
    name = 'AlignCalendarSettingsWithVersumCalendarRoute1760107000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "calendar_view_enum" ADD VALUE IF NOT EXISTS 'reception'`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" ADD COLUMN IF NOT EXISTS "first_visible_hour" TIME NOT NULL DEFAULT '09:00:00'`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" ADD COLUMN IF NOT EXISTS "days_while_editable" INTEGER NOT NULL DEFAULT 1`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" ADD COLUMN IF NOT EXISTS "customer_naming_order" VARCHAR(20) NOT NULL DEFAULT 'lastname'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" DROP COLUMN IF EXISTS "customer_naming_order"`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" DROP COLUMN IF EXISTS "days_while_editable"`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" DROP COLUMN IF EXISTS "first_visible_hour"`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" ALTER COLUMN "default_view" DROP DEFAULT`,
        );
        await queryRunner.query(
            `CREATE TYPE "calendar_view_enum_old" AS ENUM ('day', 'week', 'month')`,
        );
        await queryRunner.query(`
            ALTER TABLE "calendar_settings"
            ALTER COLUMN "default_view" TYPE "calendar_view_enum_old"
            USING (
                CASE
                    WHEN "default_view"::text = 'reception' THEN 'week'::calendar_view_enum_old
                    ELSE "default_view"::text::calendar_view_enum_old
                END
            )
        `);
        await queryRunner.query(`DROP TYPE "calendar_view_enum"`);
        await queryRunner.query(
            `ALTER TYPE "calendar_view_enum_old" RENAME TO "calendar_view_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "calendar_settings" ALTER COLUMN "default_view" SET DEFAULT 'day'`,
        );
    }
}
