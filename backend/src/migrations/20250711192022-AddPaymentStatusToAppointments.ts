import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentStatusToAppointments20250711192022 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'appointment',
            new TableColumn({
                name: 'paymentStatus',
                type: 'varchar',
                isNullable: false,
                default: `'pending'`,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('appointment', 'paymentStatus');
    }
}
