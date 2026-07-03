import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Functional audit finding: the LoyaltyTransaction entity (and the whole
 * FIFO points-expiry logic in LoyaltyService) uses "points_remaining", but
 * no migration ever created the column — CreateLoyaltyTables (1710023000000)
 * predates it. With synchronize=false every awardPoints/adjustPoints INSERT
 * failed at the driver level and surfaced as a 500, so loyalty POINTS were
 * unusable on prod (rewards/program CRUD were fine). Adds the column and
 * backfills earn-type rows defensively (prod has none — inserts always
 * rolled back — but staging/dev may).
 */
export class AddPointsRemainingToLoyaltyTransactions1761250000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "loyalty_transactions"
            ADD COLUMN IF NOT EXISTS "points_remaining" INTEGER
        `);
        await queryRunner.query(`
            UPDATE "loyalty_transactions"
            SET "points_remaining" = GREATEST("points", 0)
            WHERE "points_remaining" IS NULL AND "type" = 'earn'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "loyalty_transactions"
            DROP COLUMN IF EXISTS "points_remaining"
        `);
    }
}
