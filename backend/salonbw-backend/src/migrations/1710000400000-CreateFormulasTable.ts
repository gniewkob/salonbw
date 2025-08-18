import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFormulasTable1710000400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'formulas',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                    },
                    {
                        name: 'date',
                        type: 'timestamp',
                    },
                    {
                        name: 'clientId',
                        type: 'int',
                    },
                    {
                        name: 'appointmentId',
                        type: 'int',
                        isNullable: true,
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['clientId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                    },
                    {
                        columnNames: ['appointmentId'],
                        referencedTableName: 'appointments',
                        referencedColumnNames: ['id'],
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('formulas');
    }
}
