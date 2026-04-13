import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePushSubscriptionsTable1760930000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'push_subscriptions',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'userId',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'endpoint',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'p256dh',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'auth',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );

        await queryRunner.createIndex(
            'push_subscriptions',
            new TableIndex({
                name: 'IDX_PUSH_SUBSCRIPTION_USER_ID',
                columnNames: ['userId'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('push_subscriptions', 'IDX_PUSH_SUBSCRIPTION_USER_ID');
        await queryRunner.dropTable('push_subscriptions');
    }
}
