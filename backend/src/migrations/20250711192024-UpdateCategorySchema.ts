import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableUnique,
    TableForeignKey,
} from 'typeorm';

export class UpdateCategorySchema20250711192024 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'category',
            new TableColumn({
                name: 'description',
                type: 'text',
                isNullable: true,
            }),
        );
        await queryRunner.addColumns('category', [
            new TableColumn({
                name: 'createdAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);
        await queryRunner.changeColumn(
            'category',
            'name',
            new TableColumn({ name: 'name', type: 'varchar', length: '50' }),
        );
        await queryRunner.createUniqueConstraint(
            'category',
            new TableUnique({ columnNames: ['name'] }),
        );
        const table = await queryRunner.getTable('service');
        if (table) {
            const fk = table.foreignKeys.find((f) =>
                f.columnNames.includes('categoryId'),
            );
            if (fk) await queryRunner.dropForeignKey('service', fk);
            await queryRunner.changeColumn(
                'service',
                'categoryId',
                new TableColumn({ name: 'categoryId', type: 'int' }),
            );
            await queryRunner.createForeignKey(
                'service',
                new TableForeignKey({
                    columnNames: ['categoryId'],
                    referencedTableName: 'category',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('service');
        if (table) {
            const fk = table.foreignKeys.find((f) =>
                f.columnNames.includes('categoryId'),
            );
            if (fk) await queryRunner.dropForeignKey('service', fk);
            await queryRunner.changeColumn(
                'service',
                'categoryId',
                new TableColumn({
                    name: 'categoryId',
                    type: 'int',
                    isNullable: true,
                }),
            );
            await queryRunner.createForeignKey(
                'service',
                new TableForeignKey({
                    columnNames: ['categoryId'],
                    referencedTableName: 'category',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }),
            );
        }
        await queryRunner.dropColumn('category', 'description');
        await queryRunner.dropColumn('category', 'createdAt');
        await queryRunner.dropColumn('category', 'updatedAt');
        await queryRunner.dropUniqueConstraint(
            'category',
            new TableUnique({ columnNames: ['name'] }),
        );
    }
}
