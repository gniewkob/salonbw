import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToUsers1762510000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users"
               ADD COLUMN IF NOT EXISTS "avatarUrl" varchar(500)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users"
               DROP COLUMN IF EXISTS "avatarUrl"`,
        );
    }
}
