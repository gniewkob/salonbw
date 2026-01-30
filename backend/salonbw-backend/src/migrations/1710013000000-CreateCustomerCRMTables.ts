import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class CreateCustomerCRMTables1710013000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create customer_groups table
        await queryRunner.createTable(
            new Table({
                name: 'customer_groups',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'color',
                        type: 'varchar',
                        length: '20',
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
            }),
            true,
        );

        // Create customer_group_members join table
        await queryRunner.createTable(
            new Table({
                name: 'customer_group_members',
                columns: [
                    {
                        name: 'groupId',
                        type: 'int',
                    },
                    {
                        name: 'userId',
                        type: 'int',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createPrimaryKey('customer_group_members', [
            'groupId',
            'userId',
        ]);

        await queryRunner.createForeignKeys('customer_group_members', [
            new TableForeignKey({
                columnNames: ['groupId'],
                referencedTableName: 'customer_groups',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        ]);

        // Create customer_notes table
        await queryRunner.createTable(
            new Table({
                name: 'customer_notes',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'customerId',
                        type: 'int',
                    },
                    {
                        name: 'createdById',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'content',
                        type: 'text',
                    },
                    {
                        name: 'type',
                        type: 'varchar',
                        length: '20',
                        default: "'general'",
                    },
                    {
                        name: 'isPinned',
                        type: 'boolean',
                        default: false,
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
            }),
            true,
        );

        await queryRunner.createForeignKeys('customer_notes', [
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['createdById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        ]);

        // Create customer_tags table
        await queryRunner.createTable(
            new Table({
                name: 'customer_tags',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isUnique: true,
                    },
                    {
                        name: 'color',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Create customer_tag_assignments join table
        await queryRunner.createTable(
            new Table({
                name: 'customer_tag_assignments',
                columns: [
                    {
                        name: 'tagId',
                        type: 'int',
                    },
                    {
                        name: 'userId',
                        type: 'int',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createPrimaryKey('customer_tag_assignments', [
            'tagId',
            'userId',
        ]);

        await queryRunner.createForeignKeys('customer_tag_assignments', [
            new TableForeignKey({
                columnNames: ['tagId'],
                referencedTableName: 'customer_tags',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.dropTable('customer_tag_assignments', true, true);
        await queryRunner.dropTable('customer_tags', true, true);
        await queryRunner.dropTable('customer_notes', true, true);
        await queryRunner.dropTable('customer_group_members', true, true);
        await queryRunner.dropTable('customer_groups', true, true);
    }
}
