import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remembers which panel row was created from which record of an external
 * system (Booksy client card, Booksy booking). The historical importer reads
 * it to skip what was already imported, so the import can be re-run on a newer
 * export at cutover without duplicating clients or visits.
 */
export class CreateImportSourceLinks1762610000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "import_source_links" (
                "id" SERIAL PRIMARY KEY,
                "source" varchar(32) NOT NULL,
                "entity" varchar(32) NOT NULL,
                "externalId" varchar(64) NOT NULL,
                "localId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_import_source_links_external" UNIQUE ("source", "entity", "externalId")
            )`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_import_source_links_local" ON "import_source_links" ("entity", "localId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "import_source_links"`);
    }
}
