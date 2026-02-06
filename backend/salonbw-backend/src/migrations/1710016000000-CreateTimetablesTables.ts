import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimetablesTables1710016000000 implements MigrationInterface {
    name = 'CreateTimetablesTables1710016000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Timetables table
        await queryRunner.query(`
            CREATE TABLE "timetables" (
                "id" SERIAL PRIMARY KEY,
                "employeeId" INTEGER NOT NULL,
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "validFrom" DATE NOT NULL,
                "validTo" DATE,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_timetables_employee" FOREIGN KEY ("employeeId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Timetable slots table
        await queryRunner.query(`
            CREATE TABLE "timetable_slots" (
                "id" SERIAL PRIMARY KEY,
                "timetableId" INTEGER NOT NULL,
                "dayOfWeek" SMALLINT NOT NULL,
                "startTime" TIME NOT NULL,
                "endTime" TIME NOT NULL,
                "isBreak" BOOLEAN NOT NULL DEFAULT false,
                "notes" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_timetable_slots_timetable" FOREIGN KEY ("timetableId")
                    REFERENCES "timetables"("id") ON DELETE CASCADE,
                CONSTRAINT "CHK_dayOfWeek" CHECK ("dayOfWeek" >= 0 AND "dayOfWeek" <= 6)
            )
        `);

        // Timetable exceptions table
        await queryRunner.query(`
            CREATE TABLE "timetable_exceptions" (
                "id" SERIAL PRIMARY KEY,
                "timetableId" INTEGER NOT NULL,
                "date" DATE NOT NULL,
                "type" VARCHAR(50) NOT NULL DEFAULT 'day_off',
                "title" VARCHAR(200),
                "reason" TEXT,
                "customStartTime" TIME,
                "customEndTime" TIME,
                "isAllDay" BOOLEAN NOT NULL DEFAULT false,
                "createdById" INTEGER,
                "approvedById" INTEGER,
                "approvedAt" TIMESTAMP,
                "isPending" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_timetable_exceptions_timetable" FOREIGN KEY ("timetableId")
                    REFERENCES "timetables"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_timetable_exceptions_createdBy" FOREIGN KEY ("createdById")
                    REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_timetable_exceptions_approvedBy" FOREIGN KEY ("approvedById")
                    REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "UQ_timetable_exception_date" UNIQUE ("timetableId", "date")
            )
        `);

        // Indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_timetables_employeeId" ON "timetables" ("employeeId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetables_isActive" ON "timetables" ("isActive")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetable_slots_timetableId" ON "timetable_slots" ("timetableId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetable_slots_dayOfWeek" ON "timetable_slots" ("dayOfWeek")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetable_exceptions_timetableId" ON "timetable_exceptions" ("timetableId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetable_exceptions_date" ON "timetable_exceptions" ("date")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_timetable_exceptions_type" ON "timetable_exceptions" ("type")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_timetable_exceptions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_timetable_exceptions_date"`);
        await queryRunner.query(
            `DROP INDEX "IDX_timetable_exceptions_timetableId"`,
        );
        await queryRunner.query(`DROP INDEX "IDX_timetable_slots_dayOfWeek"`);
        await queryRunner.query(`DROP INDEX "IDX_timetable_slots_timetableId"`);
        await queryRunner.query(`DROP INDEX "IDX_timetables_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_timetables_employeeId"`);
        await queryRunner.query(`DROP TABLE "timetable_exceptions"`);
        await queryRunner.query(`DROP TABLE "timetable_slots"`);
        await queryRunner.query(`DROP TABLE "timetables"`);
    }
}
