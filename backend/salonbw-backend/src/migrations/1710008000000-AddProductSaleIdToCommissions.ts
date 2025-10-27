import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class AddProductSaleIdToCommissions1710008000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add nullable productSaleId column
        await queryRunner.addColumn(
            'commissions',
            new TableColumn({
                name: 'productSaleId',
                type: 'int',
                isNullable: true,
            }),
        );

        // Foreign key to product_sales
        await queryRunner.createForeignKey(
            'commissions',
            new TableForeignKey({
                columnNames: ['productSaleId'],
                referencedTableName: 'product_sales',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Unique index ensures at most one commission per product sale
        await queryRunner.createIndex(
            'commissions',
            new TableIndex({
                name: 'UQ_commissions_productSaleId',
                columnNames: ['productSaleId'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'commissions',
            'UQ_commissions_productSaleId',
        );

        const table = await queryRunner.getTable('commissions');
        const fk = table?.foreignKeys.find((f) =>
            f.columnNames.includes('productSaleId'),
        );
        if (fk) {
            await queryRunner.dropForeignKey('commissions', fk);
        }
        await queryRunner.dropColumn('commissions', 'productSaleId');
    }
}
