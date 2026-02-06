import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableColumn,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class AddServiceDetailsTables1760070000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extend services
        await queryRunner.addColumns('services', [
            new TableColumn({
                name: 'vatRate',
                type: 'decimal',
                precision: 5,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'isFeatured',
                type: 'boolean',
                default: false,
            }),
            new TableColumn({
                name: 'publicDescription',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'privateDescription',
                type: 'text',
                isNullable: true,
            }),
        ]);

        // Appointments: optional service variant
        await queryRunner.addColumn(
            'appointments',
            new TableColumn({
                name: 'serviceVariantId',
                type: 'int',
                isNullable: true,
            }),
        );
        await queryRunner.createForeignKey(
            'appointments',
            new TableForeignKey({
                columnNames: ['serviceVariantId'],
                referencedTableName: 'service_variants',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // Employee services: optional variant + new unique constraint
        await queryRunner.addColumn(
            'employee_services',
            new TableColumn({
                name: 'serviceVariantId',
                type: 'int',
                isNullable: true,
            }),
        );
        await queryRunner.createForeignKey(
            'employee_services',
            new TableForeignKey({
                columnNames: ['serviceVariantId'],
                referencedTableName: 'service_variants',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
        await queryRunner.dropIndex(
            'employee_services',
            'IDX_employee_service_unique',
        );
        await queryRunner.createIndex(
            'employee_services',
            new TableIndex({
                name: 'IDX_employee_service_variant_unique',
                columnNames: ['employeeId', 'serviceId', 'serviceVariantId'],
                isUnique: true,
            }),
        );

        // service_media
        await queryRunner.createTable(
            new Table({
                name: 'service_media',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'serviceId',
                        type: 'int',
                    },
                    {
                        name: 'url',
                        type: 'text',
                    },
                    {
                        name: 'caption',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'sortOrder',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'isPublic',
                        type: 'boolean',
                        default: true,
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
        await queryRunner.createForeignKey(
            'service_media',
            new TableForeignKey({
                columnNames: ['serviceId'],
                referencedTableName: 'services',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // service_reviews
        await queryRunner.createTable(
            new Table({
                name: 'service_reviews',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'serviceId',
                        type: 'int',
                    },
                    {
                        name: 'source',
                        type: 'varchar',
                        length: '20',
                        default: "'internal'",
                    },
                    {
                        name: 'rating',
                        type: 'int',
                    },
                    {
                        name: 'comment',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'authorName',
                        type: 'varchar',
                        length: '200',
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
        await queryRunner.createForeignKey(
            'service_reviews',
            new TableForeignKey({
                columnNames: ['serviceId'],
                referencedTableName: 'services',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // service_recipe_items
        await queryRunner.createTable(
            new Table({
                name: 'service_recipe_items',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'serviceId',
                        type: 'int',
                    },
                    {
                        name: 'serviceVariantId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'productId',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'unit',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
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
        await queryRunner.createForeignKeys('service_recipe_items', [
            new TableForeignKey({
                columnNames: ['serviceId'],
                referencedTableName: 'services',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['serviceVariantId'],
                referencedTableName: 'service_variants',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
            new TableForeignKey({
                columnNames: ['productId'],
                referencedTableName: 'products',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables
        await queryRunner.dropTable('service_recipe_items', true, true);
        await queryRunner.dropTable('service_reviews', true, true);
        await queryRunner.dropTable('service_media', true, true);

        // Employee services: restore unique constraint
        await queryRunner.dropIndex(
            'employee_services',
            'IDX_employee_service_variant_unique',
        );
        await queryRunner.createIndex(
            'employee_services',
            new TableIndex({
                name: 'IDX_employee_service_unique',
                columnNames: ['employeeId', 'serviceId'],
                isUnique: true,
            }),
        );
        const employeeServicesTable =
            await queryRunner.getTable('employee_services');
        const esVariantFk = employeeServicesTable?.foreignKeys.find((fk) =>
            fk.columnNames.includes('serviceVariantId'),
        );
        if (esVariantFk) {
            await queryRunner.dropForeignKey('employee_services', esVariantFk);
        }
        await queryRunner.dropColumn('employee_services', 'serviceVariantId');

        // Appointments: drop variant
        const appointmentsTable = await queryRunner.getTable('appointments');
        const apptVariantFk = appointmentsTable?.foreignKeys.find((fk) =>
            fk.columnNames.includes('serviceVariantId'),
        );
        if (apptVariantFk) {
            await queryRunner.dropForeignKey('appointments', apptVariantFk);
        }
        await queryRunner.dropColumn('appointments', 'serviceVariantId');

        // Services columns
        await queryRunner.dropColumns('services', [
            'vatRate',
            'isFeatured',
            'publicDescription',
            'privateDescription',
        ]);
    }
}
