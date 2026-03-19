import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimetableTemplatesTable1760400000000
    implements MigrationInterface
{
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE timetable_template_day_kind AS ENUM ('open', 'dayoff', 'closed')
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS timetable_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                "colorClass" VARCHAR(20) NOT NULL DEFAULT 'color1',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS timetable_template_days (
                id SERIAL PRIMARY KEY,
                "templateId" INT NOT NULL REFERENCES timetable_templates(id) ON DELETE CASCADE,
                "dayOfWeek" SMALLINT NOT NULL,
                kind timetable_template_day_kind NOT NULL DEFAULT 'open',
                "startTime" TIME NULL,
                "endTime" TIME NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT timetable_template_days_unique UNIQUE ("templateId", "dayOfWeek")
            )
        `);

        await queryRunner.query(`
            INSERT INTO timetable_templates (id, name, "colorClass")
            VALUES
                (4978, 'Poniedziałek Środa wolne', 'color1'),
                (4979, 'Recepcja', 'color2'),
                (5013, 'Stylistka paznokci', 'color3'),
                (4976, 'Wolny piątek', 'color4'),
                (4977, 'Wolny wtorek', 'color5')
            ON CONFLICT (id) DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO timetable_template_days ("templateId", "dayOfWeek", kind, "startTime", "endTime")
            VALUES
                (4978, 0, 'dayoff', NULL, NULL),
                (4978, 1, 'open', '10:00', '19:00'),
                (4978, 2, 'dayoff', NULL, NULL),
                (4978, 3, 'open', '10:00', '15:00'),
                (4978, 4, 'open', '10:00', '19:00'),
                (4978, 5, 'open', '09:00', '15:00'),
                (4978, 6, 'closed', NULL, NULL),
                (4979, 0, 'open', '10:00', '19:00'),
                (4979, 1, 'open', '10:00', '18:00'),
                (4979, 2, 'open', '10:00', '19:00'),
                (4979, 3, 'dayoff', NULL, NULL),
                (4979, 4, 'open', '10:00', '18:00'),
                (4979, 5, 'open', '09:00', '15:00'),
                (4979, 6, 'closed', NULL, NULL),
                (5013, 0, 'dayoff', NULL, NULL),
                (5013, 1, 'open', '10:00', '19:00'),
                (5013, 2, 'open', '10:00', '18:00'),
                (5013, 3, 'open', '10:00', '18:00'),
                (5013, 4, 'open', '10:00', '19:00'),
                (5013, 5, 'open', '09:00', '15:00'),
                (5013, 6, 'closed', NULL, NULL),
                (4976, 0, 'open', '10:00', '18:00'),
                (4976, 1, 'open', '10:00', '19:00'),
                (4976, 2, 'open', '11:00', '19:00'),
                (4976, 3, 'open', '10:00', '19:00'),
                (4976, 4, 'dayoff', NULL, NULL),
                (4976, 5, 'open', '09:00', '15:00'),
                (4976, 6, 'closed', NULL, NULL),
                (4977, 0, 'open', '10:00', '19:00'),
                (4977, 1, 'dayoff', NULL, NULL),
                (4977, 2, 'open', '10:00', '18:00'),
                (4977, 3, 'open', '10:00', '18:00'),
                (4977, 4, 'open', '10:00', '19:00'),
                (4977, 5, 'open', '09:00', '15:00'),
                (4977, 6, 'closed', NULL, NULL)
            ON CONFLICT ("templateId", "dayOfWeek") DO NOTHING
        `);

        await queryRunner.query(`
            SELECT setval(
                pg_get_serial_sequence('timetable_templates', 'id'),
                GREATEST((SELECT COALESCE(MAX(id), 1) FROM timetable_templates), 1)
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS timetable_template_days`);
        await queryRunner.query(`DROP TABLE IF EXISTS timetable_templates`);
        await queryRunner.query(
            `DROP TYPE IF EXISTS timetable_template_day_kind`,
        );
    }
}
