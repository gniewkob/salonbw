import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConsentsToUser20250711192023 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('user', [
            new TableColumn({
                name: 'privacyConsent',
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
            new TableColumn({
                name: 'marketingConsent',
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'privacyConsent');
        await queryRunner.dropColumn('user', 'marketingConsent');
    }
}
