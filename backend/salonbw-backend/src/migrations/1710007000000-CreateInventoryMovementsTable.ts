import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateInventoryMovementsTable1710007000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'inventory_movements',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'productId', type: 'int' },
                    { name: 'delta', type: 'int' },
                    { name: 'reason', type: 'varchar', length: '50' },
                    {
                        name: 'referenceType',
                        type: 'varchar',
                        isNullable: true,
                    },
                    { name: 'referenceId', type: 'int', isNullable: true },
                    { name: 'note', type: 'text', isNullable: true },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    { name: 'actorId', type: 'int', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['productId'],
                        referencedTableName: 'products',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                    {
                        columnNames: ['actorId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'SET NULL',
                    },
                ],
                indices: [
                    { columnNames: ['productId'] },
                    { columnNames: ['createdAt'] },
                    { columnNames: ['reason'] },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('inventory_movements');
    }
}
