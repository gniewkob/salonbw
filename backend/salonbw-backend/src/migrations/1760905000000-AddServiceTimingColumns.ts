import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServiceTimingColumns1760905000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('services', [
            new TableColumn({
                name: 'durationBefore',
                type: 'int',
                default: 0,
            }),
            new TableColumn({
                name: 'durationAfter',
                type: 'int',
                default: 0,
            }),
            new TableColumn({
                name: 'breakOffset',
                type: 'int',
                default: 0,
            }),
            new TableColumn({
                name: 'breakDuration',
                type: 'int',
                default: 0,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('services', 'breakDuration');
        await queryRunner.dropColumn('services', 'breakOffset');
        await queryRunner.dropColumn('services', 'durationAfter');
        await queryRunner.dropColumn('services', 'durationBefore');
    }
}
