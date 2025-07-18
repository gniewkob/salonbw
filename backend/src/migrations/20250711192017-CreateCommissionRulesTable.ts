import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateCommissionRulesTable20250711192017
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'commission_rule',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'employeeId', type: 'int' },
                    { name: 'targetType', type: 'varchar' },
                    { name: 'targetId', type: 'int' },
                    { name: 'commissionPercent', type: 'float' },
                ],
                indices: [
                    { columnNames: ['employeeId', 'targetType', 'targetId'] },
                ],
            }),
        );
        await queryRunner.createForeignKey(
            'commission_rule',
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('commission_rule');
    }
}
