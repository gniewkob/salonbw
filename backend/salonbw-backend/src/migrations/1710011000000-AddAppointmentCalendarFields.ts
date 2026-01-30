import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddAppointmentCalendarFields1710011000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new status values to enum
        await queryRunner.query(`
            ALTER TABLE appointments
            DROP CONSTRAINT IF EXISTS "CHK_appointments_status";
        `);

        await queryRunner.query(`
            ALTER TABLE appointments
            ALTER COLUMN status TYPE VARCHAR(20);
        `);

        // Add new columns
        await queryRunner.addColumns('appointments', [
            new TableColumn({
                name: 'internalNote',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'reservedOnline',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'reminderSent',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'reminderSentAt',
                type: 'timestamp',
                isNullable: true,
            }),
            new TableColumn({
                name: 'tags',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'paymentMethod',
                type: 'varchar',
                length: '20',
                isNullable: true,
            }),
            new TableColumn({
                name: 'paidAmount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'tipAmount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'discount',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'finalizedAt',
                type: 'timestamp',
                isNullable: true,
            }),
            new TableColumn({
                name: 'finalizedById',
                type: 'int',
                isNullable: true,
            }),
            new TableColumn({
                name: 'cancelledAt',
                type: 'timestamp',
                isNullable: true,
            }),
            new TableColumn({
                name: 'cancellationReason',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);

        // Add foreign key for finalizedBy
        await queryRunner.createForeignKey(
            'appointments',
            new TableForeignKey({
                columnNames: ['finalizedById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        const table = await queryRunner.getTable('appointments');
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('finalizedById') !== -1,
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('appointments', foreignKey);
        }

        // Drop columns
        await queryRunner.dropColumns('appointments', [
            'internalNote',
            'reservedOnline',
            'reminderSent',
            'reminderSentAt',
            'tags',
            'paymentMethod',
            'paidAmount',
            'tipAmount',
            'discount',
            'finalizedAt',
            'finalizedById',
            'cancelledAt',
            'cancellationReason',
            'createdAt',
            'updatedAt',
        ]);

        // Restore enum
        await queryRunner.query(`
            ALTER TABLE appointments
            ALTER COLUMN status TYPE VARCHAR(20);
        `);
    }
}
