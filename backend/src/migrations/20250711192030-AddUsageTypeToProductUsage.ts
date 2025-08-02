import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUsageTypeToProductUsage20250711192030
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'product_usage',
            new TableColumn({
                name: 'usageType',
                type: 'varchar',
                enum: ['SALE', 'INTERNAL', 'STOCK_CORRECTION'],
                isNullable: false,
                default: `'INTERNAL'`,
            }),
        );
        await queryRunner.changeColumn(
            'product_usage',
            'appointmentId',
            new TableColumn({
                name: 'appointmentId',
                type: 'int',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn(
            'product_usage',
            'appointmentId',
            new TableColumn({
                name: 'appointmentId',
                type: 'int',
                isNullable: false,
            }),
        );
        await queryRunner.dropColumn('product_usage', 'usageType');
    }
}
