import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchesTables1710021000000 implements MigrationInterface {
    name = 'CreateBranchesTables1710021000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create branch_status enum
        await queryRunner.query(`
            CREATE TYPE "branch_status_enum" AS ENUM ('active', 'inactive', 'suspended')
        `);

        // Create branches table
        await queryRunner.query(`
            CREATE TABLE "branches" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "slug" VARCHAR(100) NOT NULL UNIQUE,
                "description" TEXT,
                "phone" VARCHAR(20),
                "email" VARCHAR(255),
                "street" VARCHAR(255),
                "building_number" VARCHAR(20),
                "apartment_number" VARCHAR(20),
                "postal_code" VARCHAR(10),
                "city" VARCHAR(100),
                "country" VARCHAR(100),
                "latitude" DECIMAL(10, 7),
                "longitude" DECIMAL(10, 7),
                "logo_url" VARCHAR(500),
                "cover_image_url" VARCHAR(500),
                "primary_color" VARCHAR(7) DEFAULT '#25B4C1',
                "working_hours" JSONB DEFAULT '{"mon": {"open": "09:00", "close": "18:00"}, "tue": {"open": "09:00", "close": "18:00"}, "wed": {"open": "09:00", "close": "18:00"}, "thu": {"open": "09:00", "close": "18:00"}, "fri": {"open": "09:00", "close": "18:00"}, "sat": {"open": "10:00", "close": "14:00"}, "sun": null}',
                "timezone" VARCHAR(50) DEFAULT 'Europe/Warsaw',
                "currency" VARCHAR(3) DEFAULT 'PLN',
                "locale" VARCHAR(10) DEFAULT 'pl',
                "status" branch_status_enum DEFAULT 'active',
                "online_booking_enabled" BOOLEAN DEFAULT true,
                "booking_url" VARCHAR(255),
                "owner_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "sort_order" INTEGER DEFAULT 0,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create branch_members table
        await queryRunner.query(`
            CREATE TABLE "branch_members" (
                "id" SERIAL PRIMARY KEY,
                "branch_id" INTEGER NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
                "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "branch_role" VARCHAR(50) DEFAULT 'employee',
                "is_primary" BOOLEAN DEFAULT false,
                "can_manage" BOOLEAN DEFAULT false,
                "is_active" BOOLEAN DEFAULT true,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                UNIQUE("branch_id", "user_id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "idx_branches_slug" ON "branches"("slug")`);
        await queryRunner.query(`CREATE INDEX "idx_branches_status" ON "branches"("status")`);
        await queryRunner.query(`CREATE INDEX "idx_branches_city" ON "branches"("city")`);
        await queryRunner.query(`CREATE INDEX "idx_branches_owner" ON "branches"("owner_id")`);
        await queryRunner.query(`CREATE INDEX "idx_branch_members_user" ON "branch_members"("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_branch_members_branch" ON "branch_members"("branch_id")`);
        await queryRunner.query(`CREATE INDEX "idx_branch_members_primary" ON "branch_members"("user_id", "is_primary") WHERE "is_primary" = true`);

        // Create default branch from existing branch_settings
        await queryRunner.query(`
            INSERT INTO "branches" ("name", "slug", "phone", "email", "street", "building_number", "apartment_number", "postal_code", "city", "country", "timezone", "currency", "locale", "status")
            SELECT
                bs.company_name,
                'main',
                bs.phone,
                bs.email,
                bs.street,
                bs.building_number,
                bs.apartment_number,
                bs.postal_code,
                bs.city,
                bs.country,
                bs.timezone,
                bs.currency,
                bs.locale,
                'active'
            FROM "branch_settings" bs
            WHERE bs.is_active = true
            LIMIT 1
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_branch_members_primary"`);
        await queryRunner.query(`DROP INDEX "idx_branch_members_branch"`);
        await queryRunner.query(`DROP INDEX "idx_branch_members_user"`);
        await queryRunner.query(`DROP INDEX "idx_branches_owner"`);
        await queryRunner.query(`DROP INDEX "idx_branches_city"`);
        await queryRunner.query(`DROP INDEX "idx_branches_status"`);
        await queryRunner.query(`DROP INDEX "idx_branches_slug"`);
        await queryRunner.query(`DROP TABLE "branch_members"`);
        await queryRunner.query(`DROP TABLE "branches"`);
        await queryRunner.query(`DROP TYPE "branch_status_enum"`);
    }
}
