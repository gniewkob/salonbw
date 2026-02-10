import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateCustomerMediaAndEmailLogs1760100000000
    implements MigrationInterface
{
    name = 'CreateCustomerMediaAndEmailLogs1760100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'customer_files',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'customerId', type: 'int' },
                    { name: 'uploadedById', type: 'int', isNullable: true },
                    { name: 'originalName', type: 'varchar', length: '255' },
                    { name: 'storedName', type: 'varchar', length: '255' },
                    { name: 'path', type: 'varchar', length: '512' },
                    { name: 'mimeType', type: 'varchar', length: '100' },
                    { name: 'size', type: 'int' },
                    {
                        name: 'category',
                        type: 'enum',
                        enum: [
                            'consent',
                            'contract',
                            'medical',
                            'invoice',
                            'other',
                        ],
                        default: "'other'",
                    },
                    { name: 'description', type: 'text', isNullable: true },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                indices: [
                    { columnNames: ['customerId'] },
                    { columnNames: ['uploadedById'] },
                    { columnNames: ['createdAt'] },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'customer_files',
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'customer_files',
            new TableForeignKey({
                columnNames: ['uploadedById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'customer_gallery_images',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'customerId', type: 'int' },
                    { name: 'uploadedById', type: 'int', isNullable: true },
                    { name: 'path', type: 'varchar', length: '512' },
                    { name: 'thumbnailPath', type: 'varchar', length: '512' },
                    { name: 'mimeType', type: 'varchar', length: '100' },
                    { name: 'size', type: 'int' },
                    { name: 'description', type: 'text', isNullable: true },
                    { name: 'serviceId', type: 'int', isNullable: true },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                indices: [
                    { columnNames: ['customerId'] },
                    { columnNames: ['uploadedById'] },
                    { columnNames: ['createdAt'] },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'customer_gallery_images',
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'customer_gallery_images',
            new TableForeignKey({
                columnNames: ['uploadedById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'email_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    { name: 'to', type: 'varchar', length: '255' },
                    { name: 'subject', type: 'varchar', length: '255' },
                    { name: 'template', type: 'text' },
                    { name: 'data', type: 'jsonb', isNullable: true },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'sent', 'failed'],
                        default: "'pending'",
                    },
                    { name: 'errorMessage', type: 'text', isNullable: true },
                    { name: 'recipientId', type: 'int', isNullable: true },
                    { name: 'sentById', type: 'int', isNullable: true },
                    { name: 'sentAt', type: 'timestamp', isNullable: true },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                indices: [
                    { columnNames: ['recipientId'] },
                    { columnNames: ['status'] },
                    { columnNames: ['createdAt'] },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'email_logs',
            new TableForeignKey({
                columnNames: ['recipientId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'email_logs',
            new TableForeignKey({
                columnNames: ['sentById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to satisfy foreign keys.
        await queryRunner.dropTable('email_logs', true);
        await queryRunner.dropTable('customer_gallery_images', true);
        await queryRunner.dropTable('customer_files', true);
    }
}
