import { MigrationInterface, QueryRunner } from 'typeorm';
import { CATEGORIES } from './1760980000000-SeedBooksyCatalogAndHours';

/**
 * Removes the pre-Booksy service categories (Dzieci, Damskie, Męskie, Barber,
 * "Usługi dla kobiet", "Usługi dla mężczyzn", …) left over from the legacy
 * catalog. Only the four canonical Booksy categories survive. The legacy
 * services that referenced them are already onlineBooking=false (hidden from
 * booking + /services); the services.categoryId FK is ON DELETE SET NULL, so
 * deleting the rows simply nulls those stale references — no cascade needed.
 * Idempotent. Irreversible; down() is a no-op.
 */
export class RemoveLegacyServiceCategories1761040000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM "service_categories" WHERE "name" <> ALL($1::text[])`,
            [CATEGORIES],
        );
    }

    public async down(): Promise<void> {
        // No-op: legacy categories are intentionally not restored.
    }
}
