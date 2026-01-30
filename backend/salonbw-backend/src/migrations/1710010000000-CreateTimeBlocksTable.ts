import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTimeBlocksTable1710010000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'time_blocks',
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
                        name: 'startTime',
                        type: 'timestamp',
                    },
                    {
                        name: 'endTime',
                        type: 'timestamp',
                    },
                    {
                        name: 'type',
                        type: 'enum',
                        enum: ['break', 'vacation', 'training', 'sick', 'other'],
                        default: `'break'`,
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'allDay',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'recurring',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'recurringPattern',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['employeeId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('time_blocks');
    }
}
