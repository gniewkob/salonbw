import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueAppointmentIdIndexOnCommissions1710003000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_commissions_appointmentId_unique" ON "commissions" ("appointmentId") WHERE "appointmentId" IS NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "IDX_commissions_appointmentId_unique"`
        );
    }
}
