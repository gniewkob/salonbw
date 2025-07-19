import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNotificationsTable20250711192021
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'notification',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'recipient', type: 'varchar' },
                    { name: 'type', type: 'varchar' },
                    { name: 'message', type: 'text' },
                    { name: 'status', type: 'varchar' },
                    { name: 'sentAt', type: 'timestamp', default: 'now()' },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('notification');
    }
}
