import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServiceTimestamps20250711192026 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('service');
        if (!table) return;
        if (!table.columns.find((c) => c.name === 'createdAt')) {
            await queryRunner.addColumn(
                'service',
                new TableColumn({
                    name: 'createdAt',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP',
                }),
            );
        }
        if (!table.columns.find((c) => c.name === 'updatedAt')) {
            await queryRunner.addColumn(
                'service',
                new TableColumn({
                    name: 'updatedAt',
                    type: 'datetime',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('service');
        if (!table) return;
        if (table.columns.find((c) => c.name === 'updatedAt')) {
            await queryRunner.dropColumn('service', 'updatedAt');
        }
        if (table.columns.find((c) => c.name === 'createdAt')) {
            await queryRunner.dropColumn('service', 'createdAt');
        }
    }
}
