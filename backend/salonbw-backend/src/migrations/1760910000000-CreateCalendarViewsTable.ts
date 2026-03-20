import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCalendarViewsTable1760910000000
    implements MigrationInterface
{
    name = 'CreateCalendarViewsTable1760910000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "calendar_views" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(120) NOT NULL,
                "employeeIds" jsonb NOT NULL DEFAULT '[]',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "calendar_views"`);
    }
}
