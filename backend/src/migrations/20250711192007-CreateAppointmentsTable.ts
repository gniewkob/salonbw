import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAppointmentsTable20250711192007 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'appointment',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'clientId', type: 'int' },
                    { name: 'employeeId', type: 'int' },
                    { name: 'startTime', type: 'timestamp' },
                    { name: 'endTime', type: 'timestamp', isNullable: true },
                    { name: 'notes', type: 'varchar', isNullable: true },
                    { name: 'serviceId', type: 'int' },
                    {
                        name: 'status',
                        type: 'varchar',
                        enum: ['scheduled', 'completed', 'cancelled'],
                        default: "'scheduled'",
                    },
                ],
            }),
        );
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('appointment');
    }
}
