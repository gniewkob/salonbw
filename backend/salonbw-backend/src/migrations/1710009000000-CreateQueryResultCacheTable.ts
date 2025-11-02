import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateQueryResultCacheTable1710009000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'query-result-cache',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'identifier',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'time',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'duration',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'query',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'result',
                        type: 'text',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('query-result-cache');
    }
}
