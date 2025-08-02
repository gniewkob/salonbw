import {
    MigrationInterface,
    QueryRunner,
    TableColumn,
    TableUnique,
} from 'typeorm';

export class UpdateProductSchema20250711192027 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('product', [
            new TableColumn({
                name: 'lowStockThreshold',
                type: 'int',
                default: '5',
            }),
            new TableColumn({
                name: 'createdAt',
                type: 'timestamptz',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'timestamptz',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);
        await queryRunner.createUniqueConstraint(
            'product',
            new TableUnique({ columnNames: ['name'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint(
            'product',
            new TableUnique({ columnNames: ['name'] }),
        );
        await queryRunner.dropColumn('product', 'lowStockThreshold');
        await queryRunner.dropColumn('product', 'createdAt');
        await queryRunner.dropColumn('product', 'updatedAt');
    }
}
