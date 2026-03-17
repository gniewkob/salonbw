import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSmsSettingsTable1760109000000 implements MigrationInterface {
    name = 'CreateSmsSettingsTable1760109000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'sms_settings',
                columns: [
                    {
                        name: 'id',
                        type: 'serial',
                        isPrimary: true,
                    },
                    {
                        name: 'sms_type',
                        type: 'varchar',
                        length: '16',
                        default: "'standard'",
                    },
                    {
                        name: 'send_abroad',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'utf',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'default_prefix',
                        type: 'varchar',
                        length: '64',
                        default: "'+48 (Polska)'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sms_settings');
    }
}
