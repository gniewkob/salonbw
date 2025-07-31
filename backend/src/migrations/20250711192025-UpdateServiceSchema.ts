import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class UpdateServiceSchema20250711192025 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('service', [
            new TableColumn({
                name: 'createdAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updatedAt',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ]);
        await queryRunner.createUniqueConstraint(
            'service',
            new TableUnique({ columnNames: ['categoryId', 'name'] }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint(
            'service',
            new TableUnique({ columnNames: ['categoryId', 'name'] }),
        );
        await queryRunner.dropColumn('service', 'createdAt');
        await queryRunner.dropColumn('service', 'updatedAt');
    }
}
