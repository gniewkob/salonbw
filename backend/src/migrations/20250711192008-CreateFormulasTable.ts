import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFormulasTable20250711192008 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'formula',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'description', type: 'text' },
                    {
                        name: 'date',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    { name: 'clientId', type: 'int' },
                    { name: 'appointmentId', type: 'int', isNullable: true },
                ],
            }),
        );
        await queryRunner.createForeignKeys('formula', [
            new TableForeignKey({
                columnNames: ['clientId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
            new TableForeignKey({
                columnNames: ['appointmentId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('formula');
    }
}
