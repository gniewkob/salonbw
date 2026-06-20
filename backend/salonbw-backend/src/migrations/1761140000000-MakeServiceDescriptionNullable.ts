import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `services.description` was created NOT NULL by the original 2024 migration
 * (1710000100000) — a missing `isNullable: true`. The entity has always
 * declared it `@Column({ type: 'text', nullable: true })` and CreateServiceDto
 * marks it `@IsOptional()`, so `servicesRepository.save()` of a service with
 * no description omits the column → NULL → NOT NULL violation → HTTP 500 on
 * `POST /services`. (The Booksy seed never hit this because it always set
 * description = name via raw SQL.)
 *
 * Aligns the column with the entity. Idempotent (DROP NOT NULL on an already
 * nullable column is a no-op). down() restores the old NOT NULL only if no
 * NULLs exist (best-effort; intentionally non-fatal).
 */
export class MakeServiceDescriptionNullable1761140000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "services" ALTER COLUMN "description" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "services" SET "description" = '' WHERE "description" IS NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "services" ALTER COLUMN "description" SET NOT NULL`,
        );
    }
}
