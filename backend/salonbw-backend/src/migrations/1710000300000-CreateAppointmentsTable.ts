import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAppointmentsTable1710000300000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'appointments',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'clientId',
                        type: 'int',
                    },
                    {
                        name: 'employeeId',
                        type: 'int',
                    },
                    {
                        name: 'serviceId',
                        type: 'int',
                    },
                    {
                        name: 'startTime',
                        type: 'timestamp',
                    },
                    {
                        name: 'endTime',
                        type: 'timestamp',
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['scheduled', 'cancelled', 'completed'],
                        default: `'scheduled'`,
                    },
                    {
                        name: 'notes',
                        type: 'varchar',
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
        await queryRunner.dropTable('appointments');
    }
}
