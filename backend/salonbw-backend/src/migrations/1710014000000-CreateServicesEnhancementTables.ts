import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableColumn,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateServicesEnhancementTables1710014000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create service_categories table (hierarchical)
        await queryRunner.createTable(
            new Table({
                name: 'service_categories',
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
                        length: '100',
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'color',
                        type: 'varchar',
                        length: '7',
                        isNullable: true,
                    },
                    {
                        name: 'sortOrder',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'parentId',
                        type: 'int',
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

        // Add self-referencing foreign key for parent category
        await queryRunner.createForeignKey(
            'service_categories',
            new TableForeignKey({
                columnNames: ['parentId'],
                referencedTableName: 'service_categories',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // 2. Add new columns to services table
        await queryRunner.addColumns('services', [
            new TableColumn({
                name: 'priceType',
                type: 'varchar',
                length: '10',
                default: "'fixed'",
            }),
            new TableColumn({
                name: 'categoryId',
                type: 'int',
                isNullable: true,
            }),
            new TableColumn({
                name: 'isActive',
                type: 'boolean',
                default: true,
            }),
            new TableColumn({
                name: 'onlineBooking',
                type: 'boolean',
                default: true,
            }),
            new TableColumn({
                name: 'sortOrder',
                type: 'int',
                default: 0,
            }),
            new TableColumn({
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);

        // Add foreign key from services to service_categories
        await queryRunner.createForeignKey(
            'services',
            new TableForeignKey({
                columnNames: ['categoryId'],
                referencedTableName: 'service_categories',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );

        // 3. Create service_variants table
        await queryRunner.createTable(
            new Table({
                name: 'service_variants',
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
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'duration',
                        type: 'int',
                    },
                    {
                        name: 'price',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: 'priceType',
                        type: 'varchar',
                        length: '10',
                        default: "'fixed'",
                    },
                    {
                        name: 'sortOrder',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'isActive',
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
            'service_variants',
            new TableForeignKey({
                columnNames: ['serviceId'],
                referencedTableName: 'services',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // 4. Create employee_services table
        await queryRunner.createTable(
            new Table({
                name: 'employee_services',
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
                        name: 'serviceId',
                        type: 'int',
                    },
                    {
                        name: 'customDuration',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'customPrice',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'commissionPercent',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
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

        // Add foreign keys for employee_services
        await queryRunner.createForeignKeys('employee_services', [
            new TableForeignKey({
                columnNames: ['employeeId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
            new TableForeignKey({
                columnNames: ['serviceId'],
                referencedTableName: 'services',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        ]);

        // Add unique constraint for employee-service combination
        await queryRunner.createIndex(
            'employee_services',
            new TableIndex({
                name: 'IDX_employee_service_unique',
                columnNames: ['employeeId', 'serviceId'],
                isUnique: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop in reverse order
        await queryRunner.dropTable('employee_services', true, true);
        await queryRunner.dropTable('service_variants', true, true);

        // Remove foreign key from services to service_categories
        const servicesTable = await queryRunner.getTable('services');
        const categoryForeignKey = servicesTable?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('categoryId') !== -1,
        );
        if (categoryForeignKey) {
            await queryRunner.dropForeignKey('services', categoryForeignKey);
        }

        // Remove added columns from services
        await queryRunner.dropColumns('services', [
            'priceType',
            'categoryId',
            'isActive',
            'onlineBooking',
            'sortOrder',
            'createdAt',
            'updatedAt',
        ]);

        await queryRunner.dropTable('service_categories', true, true);
    }
}
