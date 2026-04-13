import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddSocialAuthColumnsToUsers1760920000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add googleId column
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'googleId',
                type: 'varchar',
                isNullable: true,
                isUnique: true,
            }),
        );

        // Add facebookId column
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'facebookId',
                type: 'varchar',
                isNullable: true,
                isUnique: true,
            }),
        );

        // Add indexes for faster lookups
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_GOOGLE_ID',
                columnNames: ['googleId'],
            }),
        );

        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_FACEBOOK_ID',
                columnNames: ['facebookId'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('users', 'IDX_USERS_FACEBOOK_ID');
        await queryRunner.dropIndex('users', 'IDX_USERS_GOOGLE_ID');
        await queryRunner.dropColumn('users', 'facebookId');
        await queryRunner.dropColumn('users', 'googleId');
    }
}
