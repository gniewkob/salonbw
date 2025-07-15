import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateEmployeeRoles20250711192014 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "user" SET role = 'ADMIN' WHERE role = 'admin'`,
        );
        await queryRunner.query(
            `UPDATE "user" SET role = 'FRYZJER' WHERE role = 'employee'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "user" SET role = 'employee' WHERE role = 'FRYZJER'`,
        );
        await queryRunner.query(
            `UPDATE "user" SET role = 'admin' WHERE role = 'ADMIN'`,
        );
    }
}
