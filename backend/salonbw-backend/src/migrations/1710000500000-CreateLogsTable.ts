import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLogsTable1710000500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'logs',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'userId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'action',
                        type: 'enum',
                        enum: [
                            'USER_LOGIN',
                            'LOGIN_FAIL',
                            'USER_REGISTERED',
                            'AUTHORIZATION_FAILURE',
                            'PRODUCT_CREATED',
                            'PRODUCT_UPDATED',
                            'PRODUCT_DELETED',
                            'SERVICE_CREATED',
                            'SERVICE_UPDATED',
                            'SERVICE_DELETED',
                            'APPOINTMENT_CREATED',
                            'APPOINTMENT_CANCELLED',
                            'APPOINTMENT_COMPLETED',
                            'COMMISSION_CREATED',
                        ],
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'timestamp',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['userId'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('logs');
    }
}
