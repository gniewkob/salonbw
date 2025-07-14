import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProductsTable20250711192006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'product',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'name', type: 'varchar' },
                    { name: 'brand', type: 'varchar', isNullable: true },
                    { name: 'unitPrice', type: 'decimal', precision: 10, scale: 2 },
                    { name: 'stock', type: 'int' },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('product');
    }
}
