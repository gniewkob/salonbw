import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGiftCardsTables1710022000000 implements MigrationInterface {
    name = 'CreateGiftCardsTables1710022000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create gift_card_status enum
        await queryRunner.query(`
            CREATE TYPE "gift_card_status_enum" AS ENUM ('active', 'used', 'expired', 'cancelled')
        `);

        // Create gift_card_transaction_type enum
        await queryRunner.query(`
            CREATE TYPE "gift_card_transaction_type_enum" AS ENUM ('purchase', 'redemption', 'refund', 'adjustment', 'expiration')
        `);

        // Create gift_cards table
        await queryRunner.query(`
            CREATE TABLE "gift_cards" (
                "id" SERIAL PRIMARY KEY,
                "code" VARCHAR(20) NOT NULL UNIQUE,
                "initial_value" DECIMAL(10, 2) NOT NULL,
                "current_balance" DECIMAL(10, 2) NOT NULL,
                "currency" VARCHAR(3) DEFAULT 'PLN',
                "status" gift_card_status_enum DEFAULT 'active',
                "valid_from" DATE NOT NULL,
                "valid_until" DATE NOT NULL,
                "purchased_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "purchaser_name" VARCHAR(255),
                "purchaser_email" VARCHAR(255),
                "recipient_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "recipient_name" VARCHAR(255),
                "recipient_email" VARCHAR(255),
                "message" TEXT,
                "template_id" VARCHAR(50),
                "allowed_services" JSONB DEFAULT '[]',
                "min_purchase_amount" DECIMAL(10, 2),
                "notes" TEXT,
                "sold_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "sold_at" TIMESTAMP,
                "created_at" TIMESTAMP DEFAULT now(),
                "updated_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create gift_card_transactions table
        await queryRunner.query(`
            CREATE TABLE "gift_card_transactions" (
                "id" SERIAL PRIMARY KEY,
                "gift_card_id" INTEGER NOT NULL REFERENCES "gift_cards"("id") ON DELETE CASCADE,
                "type" gift_card_transaction_type_enum NOT NULL,
                "amount" DECIMAL(10, 2) NOT NULL,
                "balance_after" DECIMAL(10, 2) NOT NULL,
                "appointment_id" INTEGER,
                "performed_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
                "notes" TEXT,
                "created_at" TIMESTAMP DEFAULT now()
            )
        `);

        // Create indexes
        await queryRunner.query(
            `CREATE INDEX "idx_gift_cards_code" ON "gift_cards"("code")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_cards_status" ON "gift_cards"("status")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_cards_valid_until" ON "gift_cards"("valid_until")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_cards_recipient" ON "gift_cards"("recipient_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_cards_purchased_by" ON "gift_cards"("purchased_by_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_card_transactions_card" ON "gift_card_transactions"("gift_card_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_gift_card_transactions_type" ON "gift_card_transactions"("type")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_gift_card_transactions_type"`);
        await queryRunner.query(`DROP INDEX "idx_gift_card_transactions_card"`);
        await queryRunner.query(`DROP INDEX "idx_gift_cards_purchased_by"`);
        await queryRunner.query(`DROP INDEX "idx_gift_cards_recipient"`);
        await queryRunner.query(`DROP INDEX "idx_gift_cards_valid_until"`);
        await queryRunner.query(`DROP INDEX "idx_gift_cards_status"`);
        await queryRunner.query(`DROP INDEX "idx_gift_cards_code"`);
        await queryRunner.query(`DROP TABLE "gift_card_transactions"`);
        await queryRunner.query(`DROP TABLE "gift_cards"`);
        await queryRunner.query(`DROP TYPE "gift_card_transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "gift_card_status_enum"`);
    }
}
