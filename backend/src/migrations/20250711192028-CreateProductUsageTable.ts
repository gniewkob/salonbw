import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateProductUsageTable20250711192028
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'product_usage',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'appointmentId', type: 'int' },
                    { name: 'productId', type: 'int' },
                    { name: 'quantity', type: 'int' },
                    { name: 'usedByEmployeeId', type: 'int' },
                    { name: 'timestamp', type: 'timestamp', default: 'now()' },
                ],
            }),
        );
        await queryRunner.createForeignKeys('product_usage', [
            new TableForeignKey({
                columnNames: ['appointmentId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['productId'],
                referencedTableName: 'product',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['usedByEmployeeId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('product_usage');
    }
}
