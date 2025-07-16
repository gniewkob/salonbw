import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSalesTable20250711192018 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'sale',
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
                    { name: 'productId', type: 'int' },
                    { name: 'quantity', type: 'int' },
                    { name: 'soldAt', type: 'timestamp', default: 'now()' },
                ],
            }),
        );
        await queryRunner.createForeignKeys('sale', [
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
                columnNames: ['productId'],
                referencedTableName: 'product',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sale');
    }
}
