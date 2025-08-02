import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateInvoicesTable20250711192029 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'invoice',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'reservationId', type: 'int' },
                    { name: 'number', type: 'varchar' },
                    { name: 'pdfUrl', type: 'varchar' },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: `'issued'`,
                    },
                ],
            }),
        );
        await queryRunner.createForeignKey(
            'invoice',
            new TableForeignKey({
                columnNames: ['reservationId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('invoice');
    }
}
