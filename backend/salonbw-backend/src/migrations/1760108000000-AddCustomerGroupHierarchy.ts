import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableForeignKey,
} from 'typeorm';

export class AddCustomerGroupHierarchy1760108000000
    implements MigrationInterface
{
    name = 'AddCustomerGroupHierarchy1760108000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'customer_groups',
            new TableColumn({
                name: 'parentId',
                type: 'int',
                isNullable: true,
            }),
        );
        await queryRunner.addColumn(
            'customer_groups',
            new TableColumn({
                name: 'sortOrder',
                type: 'int',
                default: 0,
            }),
        );
        await queryRunner.createForeignKey(
            'customer_groups',
            new TableForeignKey({
                columnNames: ['parentId'],
                referencedTableName: 'customer_groups',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
        await queryRunner.query(`
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) - 1 AS sort_order
                FROM customer_groups
            )
            UPDATE customer_groups cg
            SET "sortOrder" = ranked.sort_order
            FROM ranked
            WHERE ranked.id = cg.id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('customer_groups');
        const parentForeignKey = table?.foreignKeys.find((foreignKey) =>
            foreignKey.columnNames.includes('parentId'),
        );

        if (parentForeignKey) {
            await queryRunner.dropForeignKey(
                'customer_groups',
                parentForeignKey,
            );
        }

        await queryRunner.dropColumn('customer_groups', 'sortOrder');
        await queryRunner.dropColumn('customer_groups', 'parentId');
    }
}
