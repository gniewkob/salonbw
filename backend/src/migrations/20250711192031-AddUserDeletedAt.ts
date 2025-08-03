import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserDeletedAt20250711192031 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'user',
            new TableColumn({
                name: 'deletedAt',
                type: 'timestamptz',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user', 'deletedAt');
    }
}
