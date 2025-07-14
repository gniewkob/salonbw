import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCommissionRecordsTable20250711192009 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'commission_record',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'employeeId', type: 'int' },
                    { name: 'appointmentId', type: 'int', isNullable: true },
                    { name: 'productId', type: 'int', isNullable: true },
                    { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
                    { name: 'percent', type: 'float' },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('commission_record');
    }
}
