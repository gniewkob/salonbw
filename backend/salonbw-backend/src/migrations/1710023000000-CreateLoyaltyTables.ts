import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoyaltyTables1710023000000 implements MigrationInterface {
    name = 'CreateLoyaltyTables1710023000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`
            CREATE TYPE "loyalty_transaction_type_enum" AS ENUM ('earn', 'spend', 'expire', 'adjust', 'bonus', 'referral')
        `);

        await queryRunner.query(`
            CREATE TYPE "loyalty_transaction_source_enum" AS ENUM ('appointment', 'product_purchase', 'reward', 'birthday', 'referral', 'signup', 'manual', 'expiration')
        `);

        await queryRunner.query(`
            CREATE TYPE "reward_type_enum" AS ENUM ('discount', 'free_service', 'free_product', 'gift_card', 'custom')
        `);

        // Create loyalty_programs table
        await queryRunner.query(`
            CREATE TABLE "loyalty_programs" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "points_per_currency" DECIMAL(10, 2) DEFAULT 1,
                "min_points_per_visit" INTEGER DEFAULT 0,
                "max_points_per_visit" INTEGER,
                "birthday_bonus_points" INTEGER DEFAULT 0,
                "referral_bonus_points" INTEGER DEFAULT 0,
                "signup_bonus_points" INTEGER DEFAULT 0,
                "points_value_currency" DECIMAL(10, 4) DEFAULT 0.01,
                "min_points_redemption" INTEGER DEFAULT 100,
                "points_expire_months" INTEGER,
                "enable_tiers" BOOLEAN DEFAULT false,
                "tier_thresholds" JSONB DEFAULT '[]',
                "is_active" BOOLEAN DEFAULT true,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create loyalty_balances table
        await queryRunner.query(`
            CREATE TABLE "loyalty_balances" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "total_points_earned" INTEGER DEFAULT 0,
                "total_points_spent" INTEGER DEFAULT 0,
                "current_balance" INTEGER DEFAULT 0,
                "lifetime_tier_points" INTEGER DEFAULT 0,
                "current_tier" VARCHAR(50),
                "tier_multiplier" DECIMAL(3, 2) DEFAULT 1.0,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now(),
                UNIQUE("user_id")
            )
        `);

        // Create loyalty_transactions table
        await queryRunner.query(`
            CREATE TABLE "loyalty_transactions" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "type" loyalty_transaction_type_enum NOT NULL,
                "source" loyalty_transaction_source_enum NOT NULL,
                "points" INTEGER NOT NULL,
                "balance_after" INTEGER NOT NULL,
                "appointment_id" INTEGER,
                "reward_id" INTEGER,
                "referral_user_id" INTEGER,
                "description" TEXT,
                "performed_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "expires_at" TIMESTAMP,
                "is_expired" BOOLEAN DEFAULT false,
                "created_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create loyalty_rewards table
        await queryRunner.query(`
            CREATE TABLE "loyalty_rewards" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "type" reward_type_enum NOT NULL,
                "points_cost" INTEGER NOT NULL,
                "discount_percent" INTEGER,
                "discount_amount" DECIMAL(10, 2),
                "service_id" INTEGER,
                "product_id" INTEGER,
                "gift_card_value" DECIMAL(10, 2),
                "is_active" BOOLEAN DEFAULT true,
                "available_from" DATE,
                "available_until" DATE,
                "max_redemptions" INTEGER,
                "current_redemptions" INTEGER DEFAULT 0,
                "image_url" VARCHAR(500),
                "sort_order" INTEGER DEFAULT 0,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create loyalty_reward_redemptions table
        await queryRunner.query(`
            CREATE TABLE "loyalty_reward_redemptions" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "reward_id" INTEGER NOT NULL REFERENCES "loyalty_rewards"("id") ON DELETE CASCADE,
                "points_spent" INTEGER NOT NULL,
                "transaction_id" INTEGER NOT NULL,
                "status" VARCHAR(20) DEFAULT 'active',
                "used_at" TIMESTAMP,
                "used_appointment_id" INTEGER,
                "expires_at" TIMESTAMP,
                "redemption_code" VARCHAR(20) NOT NULL UNIQUE,
                "processed_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "created_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "idx_loyalty_balances_user" ON "loyalty_balances"("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_balances_tier" ON "loyalty_balances"("current_tier")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_transactions_user" ON "loyalty_transactions"("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_transactions_type" ON "loyalty_transactions"("type")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_transactions_source" ON "loyalty_transactions"("source")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_transactions_expires" ON "loyalty_transactions"("expires_at") WHERE "is_expired" = false`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_rewards_active" ON "loyalty_rewards"("is_active", "points_cost")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_redemptions_user" ON "loyalty_reward_redemptions"("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_redemptions_code" ON "loyalty_reward_redemptions"("redemption_code")`);
        await queryRunner.query(`CREATE INDEX "idx_loyalty_redemptions_status" ON "loyalty_reward_redemptions"("status")`);

        // Insert default loyalty program
        await queryRunner.query(`
            INSERT INTO "loyalty_programs" ("name", "description", "points_per_currency", "points_value_currency", "min_points_redemption")
            VALUES ('Program Lojalnościowy', 'Zbieraj punkty za każdą wizytę i wymieniaj na nagrody!', 1, 0.01, 100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_loyalty_redemptions_status"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_redemptions_code"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_redemptions_user"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_rewards_active"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_transactions_expires"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_transactions_source"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_transactions_type"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_transactions_user"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_balances_tier"`);
        await queryRunner.query(`DROP INDEX "idx_loyalty_balances_user"`);
        await queryRunner.query(`DROP TABLE "loyalty_reward_redemptions"`);
        await queryRunner.query(`DROP TABLE "loyalty_rewards"`);
        await queryRunner.query(`DROP TABLE "loyalty_transactions"`);
        await queryRunner.query(`DROP TABLE "loyalty_balances"`);
        await queryRunner.query(`DROP TABLE "loyalty_programs"`);
        await queryRunner.query(`DROP TYPE "reward_type_enum"`);
        await queryRunner.query(`DROP TYPE "loyalty_transaction_source_enum"`);
        await queryRunner.query(`DROP TYPE "loyalty_transaction_type_enum"`);
    }
}
