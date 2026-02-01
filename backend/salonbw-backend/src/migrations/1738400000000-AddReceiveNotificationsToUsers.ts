import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiveNotificationsToUsers1738400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(
            'users',
            'receiveNotifications',
        );
        if (hasColumn) return;
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'receiveNotifications',
                type: 'boolean',
                isNullable: false,
                default: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn(
            'users',
            'receiveNotifications',
        );
        if (!hasColumn) return;
        await queryRunner.dropColumn('users', 'receiveNotifications');
    }
}
