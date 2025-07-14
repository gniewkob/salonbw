import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateServicesTable20250711192005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'service',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'name', type: 'varchar' },
                    { name: 'description', type: 'varchar', isNullable: true },
                    { name: 'duration', type: 'int' },
                    { name: 'price', type: 'decimal', precision: 10, scale: 2 },
                    {
                        name: 'defaultCommissionPercent',
                        type: 'float',
                        isNullable: true,
                    },
                    { name: 'categoryId', type: 'int', isNullable: true },
                ],
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('service');
    }
}
