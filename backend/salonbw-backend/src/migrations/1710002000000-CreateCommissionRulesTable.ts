import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCommissionRulesTable1710002000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'commission_rules',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'employeeId',
                        type: 'int',
                    },
                    {
                        name: 'serviceId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'commissionPercent',
                        type: 'decimal',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['employeeId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                    },
                    {
                        columnNames: ['serviceId'],
                        referencedTableName: 'services',
                        referencedColumnNames: ['id'],
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('commission_rules');
    }
}
