import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddOnDeleteConstraints20250711192012
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const appointment = await queryRunner.getTable('appointment');
        if (appointment) {
            const clientFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('clientId'),
            );
            if (clientFk)
                await queryRunner.dropForeignKey('appointment', clientFk);
            const employeeFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('employeeId'),
            );
            if (employeeFk)
                await queryRunner.dropForeignKey('appointment', employeeFk);
            const serviceFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('serviceId'),
            );
            if (serviceFk)
                await queryRunner.dropForeignKey('appointment', serviceFk);
            await queryRunner.createForeignKeys('appointment', [
                new TableForeignKey({
                    columnNames: ['clientId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
                new TableForeignKey({
                    columnNames: ['employeeId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
                new TableForeignKey({
                    columnNames: ['serviceId'],
                    referencedTableName: 'service',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
            ]);
        }

        const commission = await queryRunner.getTable('commission_record');
        if (commission) {
            const employeeFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('employeeId'),
            );
            if (employeeFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    employeeFk,
                );
            const appointmentFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('appointmentId'),
            );
            if (appointmentFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    appointmentFk,
                );
            const productFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('productId'),
            );
            if (productFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    productFk,
                );
            await queryRunner.createForeignKeys('commission_record', [
                new TableForeignKey({
                    columnNames: ['employeeId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
                new TableForeignKey({
                    columnNames: ['appointmentId'],
                    referencedTableName: 'appointment',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
                new TableForeignKey({
                    columnNames: ['productId'],
                    referencedTableName: 'product',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            ]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const appointment = await queryRunner.getTable('appointment');
        if (appointment) {
            const clientFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('clientId'),
            );
            if (clientFk)
                await queryRunner.dropForeignKey('appointment', clientFk);
            const employeeFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('employeeId'),
            );
            if (employeeFk)
                await queryRunner.dropForeignKey('appointment', employeeFk);
            const serviceFk = appointment.foreignKeys.find((fk) =>
                fk.columnNames.includes('serviceId'),
            );
            if (serviceFk)
                await queryRunner.dropForeignKey('appointment', serviceFk);
            await queryRunner.createForeignKeys('appointment', [
                new TableForeignKey({
                    columnNames: ['clientId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                }),
                new TableForeignKey({
                    columnNames: ['employeeId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                }),
                new TableForeignKey({
                    columnNames: ['serviceId'],
                    referencedTableName: 'service',
                    referencedColumnNames: ['id'],
                }),
            ]);
        }

        const commission = await queryRunner.getTable('commission_record');
        if (commission) {
            const employeeFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('employeeId'),
            );
            if (employeeFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    employeeFk,
                );
            const appointmentFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('appointmentId'),
            );
            if (appointmentFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    appointmentFk,
                );
            const productFk = commission.foreignKeys.find((fk) =>
                fk.columnNames.includes('productId'),
            );
            if (productFk)
                await queryRunner.dropForeignKey(
                    'commission_record',
                    productFk,
                );
            await queryRunner.createForeignKeys('commission_record', [
                new TableForeignKey({
                    columnNames: ['employeeId'],
                    referencedTableName: 'user',
                    referencedColumnNames: ['id'],
                }),
                new TableForeignKey({
                    columnNames: ['appointmentId'],
                    referencedTableName: 'appointment',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
                new TableForeignKey({
                    columnNames: ['productId'],
                    referencedTableName: 'product',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            ]);
        }
    }
}
