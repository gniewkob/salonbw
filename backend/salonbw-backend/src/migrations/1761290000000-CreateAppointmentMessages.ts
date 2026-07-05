import { MigrationInterface, QueryRunner } from 'typeorm';

/** Per-appointment two-way client↔salon message thread. */
export class CreateAppointmentMessages1761290000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "appointment_messages" (
                "id" SERIAL PRIMARY KEY,
                "appointmentId" INTEGER NOT NULL
                    REFERENCES "appointments"("id") ON DELETE CASCADE,
                "authorId" INTEGER
                    REFERENCES "users"("id") ON DELETE SET NULL,
                "authorRole" VARCHAR(20) NOT NULL,
                "body" TEXT NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_appointment_messages_appointment"
            ON "appointment_messages" ("appointmentId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "appointment_messages"`);
    }
}
