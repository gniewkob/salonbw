import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConsentsToUser20250711192023 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('user', [
            new TableColumn({
                name: 'consentRODO',
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
            new TableColumn({
                name: 'consentMarketing',
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'consentRODO');
        await queryRunner.dropColumn('user', 'consentMarketing');
    }
}
