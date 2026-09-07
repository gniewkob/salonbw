import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordRecovery1762580000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "authVersion" integer NOT NULL DEFAULT 0`,
        );
        await queryRunner.query(`
            CREATE TABLE "password_reset_tokens" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "tokenHash" character(64) NOT NULL,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "usedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_password_reset_tokens_hash" UNIQUE ("tokenHash"),
                CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_tokens_user" ON "password_reset_tokens" ("userId")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_password_reset_tokens_expires" ON "password_reset_tokens" ("expiresAt")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "authVersion"`,
        );
    }
}
