import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMessagesTable20250711192011 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'message',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'senderId', type: 'int' },
                    { name: 'recipientId', type: 'int' },
                    { name: 'content', type: 'varchar' },
                    {
                        name: 'sentAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );
        await queryRunner.createForeignKeys('message', [
            new TableForeignKey({
                columnNames: ['senderId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
            }),
            new TableForeignKey({
                columnNames: ['recipientId'],
                referencedTableName: 'user',
                referencedColumnNames: ['id'],
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('message');
    }
}
