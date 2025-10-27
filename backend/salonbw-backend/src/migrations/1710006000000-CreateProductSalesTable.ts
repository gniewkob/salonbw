import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProductSalesTable1710006000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'product_sales',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'productId', type: 'int' },
                    {
                        name: 'soldAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    { name: 'quantity', type: 'int' },
                    { name: 'unitPrice', type: 'decimal' },
                    { name: 'discount', type: 'decimal', isNullable: true },
                    { name: 'employeeId', type: 'int', isNullable: true },
                    { name: 'appointmentId', type: 'int', isNullable: true },
                    { name: 'note', type: 'text', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['productId'],
                        referencedTableName: 'products',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                    {
                        columnNames: ['employeeId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                    {
                        columnNames: ['appointmentId'],
                        referencedTableName: 'appointments',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
                indices: [
                    { columnNames: ['productId'] },
                    { columnNames: ['employeeId'] },
                    { columnNames: ['appointmentId'] },
                    { columnNames: ['soldAt'] },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('product_sales');
    }
}
