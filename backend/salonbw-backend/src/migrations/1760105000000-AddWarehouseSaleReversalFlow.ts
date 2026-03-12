import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class AddWarehouseSaleReversalFlow1760105000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('warehouse_sales', [
            new TableColumn({
                name: 'kind',
                type: 'varchar',
                length: '20',
                default: "'sale'",
            }),
            new TableColumn({
                name: 'status',
                type: 'varchar',
                length: '20',
                default: "'active'",
            }),
            new TableColumn({
                name: 'sourceSaleId',
                type: 'int',
                isNullable: true,
            }),
            new TableColumn({
                name: 'reversalReason',
                type: 'text',
                isNullable: true,
            }),
        ]);

        await queryRunner.createForeignKey(
            'warehouse_sales',
            new TableForeignKey({
                columnNames: ['sourceSaleId'],
                referencedTableName: 'warehouse_sales',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createIndex(
            'warehouse_sales',
            new TableIndex({
                name: 'IDX_warehouse_sales_sourceSaleId',
                columnNames: ['sourceSaleId'],
            }),
        );

        await queryRunner.addColumn(
            'warehouse_sale_items',
            new TableColumn({
                name: 'originalSaleItemId',
                type: 'int',
                isNullable: true,
            }),
        );

        await queryRunner.createIndex(
            'warehouse_sale_items',
            new TableIndex({
                name: 'IDX_warehouse_sale_items_originalSaleItemId',
                columnNames: ['originalSaleItemId'],
            }),
        );

        await queryRunner.addColumns('product_sales', [
            new TableColumn({
                name: 'warehouseSaleId',
                type: 'int',
                isNullable: true,
            }),
            new TableColumn({
                name: 'warehouseSaleItemId',
                type: 'int',
                isNullable: true,
            }),
        ]);

        await queryRunner.createIndex(
            'product_sales',
            new TableIndex({
                name: 'IDX_product_sales_warehouseSaleId',
                columnNames: ['warehouseSaleId'],
            }),
        );
        await queryRunner.createIndex(
            'product_sales',
            new TableIndex({
                name: 'IDX_product_sales_warehouseSaleItemId',
                columnNames: ['warehouseSaleItemId'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'product_sales',
            'IDX_product_sales_warehouseSaleItemId',
        );
        await queryRunner.dropIndex(
            'product_sales',
            'IDX_product_sales_warehouseSaleId',
        );
        await queryRunner.dropColumn('product_sales', 'warehouseSaleItemId');
        await queryRunner.dropColumn('product_sales', 'warehouseSaleId');

        await queryRunner.dropIndex(
            'warehouse_sale_items',
            'IDX_warehouse_sale_items_originalSaleItemId',
        );
        await queryRunner.dropColumn(
            'warehouse_sale_items',
            'originalSaleItemId',
        );

        await queryRunner.dropIndex(
            'warehouse_sales',
            'IDX_warehouse_sales_sourceSaleId',
        );

        const table = await queryRunner.getTable('warehouse_sales');
        const foreignKey = table?.foreignKeys.find((key) =>
            key.columnNames.includes('sourceSaleId'),
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('warehouse_sales', foreignKey);
        }

        await queryRunner.dropColumn('warehouse_sales', 'reversalReason');
        await queryRunner.dropColumn('warehouse_sales', 'sourceSaleId');
        await queryRunner.dropColumn('warehouse_sales', 'status');
        await queryRunner.dropColumn('warehouse_sales', 'kind');
    }
}
