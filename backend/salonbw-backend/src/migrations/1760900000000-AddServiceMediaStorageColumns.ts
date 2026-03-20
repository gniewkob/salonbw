import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServiceMediaStorageColumns1760900000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('service_media', [
            new TableColumn({
                name: 'storagePath',
                type: 'text',
                isNullable: true,
            }),
            new TableColumn({
                name: 'mimeType',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }),
            new TableColumn({
                name: 'size',
                type: 'int',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('service_media', 'size');
        await queryRunner.dropColumn('service_media', 'mimeType');
        await queryRunner.dropColumn('service_media', 'storagePath');
    }
}
