import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * No migration ever created `refresh_tokens` or `login_attempt`. Production has
 * both because they were created outside the migration chain, so a database
 * built from migrations alone (a new environment, or a rebuild after losing the
 * database) had no auth tables: registration and login failed with
 * `relation "refresh_tokens" does not exist`.
 *
 * The DDL is what TypeORM itself generates for the two entities, so the index
 * and constraint names match tables that TypeORM created on production.
 *
 * Each table is created together with its indexes only when the table is
 * absent. Checking the table rather than each index keeps this a strict no-op
 * on production even if its indexes carry different names, instead of adding
 * duplicates beside them.
 */
export class CreateMissingAuthTables1762600000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!(await queryRunner.hasTable('refresh_tokens'))) {
            await queryRunner.query(
                `CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "jti" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "meta" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId")`,
            );
            await queryRunner.query(
                `CREATE UNIQUE INDEX "IDX_f3752400c98d5c0b3dca54d66d" ON "refresh_tokens" ("jti")`,
            );
        }
        if (!(await queryRunner.hasTable('login_attempt'))) {
            await queryRunner.query(
                `CREATE TABLE "login_attempt" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "ipAddress" character varying NOT NULL, "successful" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "captchaRequired" boolean, CONSTRAINT "PK_72829cd4f7424e3cdfd46c476c0" PRIMARY KEY ("id"))`,
            );
        }
    }

    public async down(): Promise<void> {
        // Intentionally empty. On production these tables predate this
        // migration and hold live sessions and the login throttle; reverting
        // must never drop them.
    }
}
