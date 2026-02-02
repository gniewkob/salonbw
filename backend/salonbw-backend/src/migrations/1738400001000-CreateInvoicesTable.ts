import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateInvoicesTable1738400001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'invoices',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'number',
                        type: 'varchar',
                        isUnique: true,
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
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['draft', 'sent', 'paid', 'cancelled'],
                        default: "'draft'",
                    },
                    {
                        name: 'notes',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'paidAt',
                        type: 'timestamp',
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
        await queryRunner.dropTable('invoices');
    }
}
