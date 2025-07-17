import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneToUser20250711192020 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'phone',
                type: 'varchar',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'phone');
    }
}
