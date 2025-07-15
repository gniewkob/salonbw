import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLogsTable20250711192013 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'log',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'userId', type: 'int', isNullable: true },
                    { name: 'action', type: 'varchar' },
                    { name: 'description', type: 'text', isNullable: true },
                    {
                        name: 'timestamp',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );
        await queryRunner.createForeignKey(
            'log',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('log');
    }
}
