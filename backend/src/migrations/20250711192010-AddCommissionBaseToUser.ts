import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCommissionBaseToUser20250711192010
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'commissionBase',
                type: 'float',
                isNullable: false,
                default: '10',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'commissionBase');
    }
}
