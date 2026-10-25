import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemAdministratorFlag1762620000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSystemAdmin" boolean NOT NULL DEFAULT false',
        );
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "users" DROP COLUMN "isSystemAdmin"',
        );
    }
}
