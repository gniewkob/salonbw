import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCommissionsTable1710001000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'commissions',
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
                        name: 'appointmentId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'productId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                    },
                    {
                        name: 'percent',
                        type: 'decimal',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['employeeId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                    },
                    {
                        columnNames: ['appointmentId'],
                        referencedTableName: 'appointments',
                        referencedColumnNames: ['id'],
                    },
                    {
                        columnNames: ['productId'],
                        referencedTableName: 'products',
                        referencedColumnNames: ['id'],
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('commissions');
    }
}
