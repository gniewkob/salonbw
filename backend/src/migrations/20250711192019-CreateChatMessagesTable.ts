import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateChatMessagesTable20250711192019
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'chat_message',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'appointmentId', type: 'int' },
                    { name: 'senderId', type: 'int' },
                    { name: 'message', type: 'text' },
                    {
                        name: 'timestamp',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );
        await queryRunner.createForeignKeys('chat_message', [
            new TableForeignKey({
                columnNames: ['appointmentId'],
                referencedTableName: 'appointment',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['senderId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('chat_message');
    }
}
