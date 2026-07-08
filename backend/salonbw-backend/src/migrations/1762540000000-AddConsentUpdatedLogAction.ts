import { MigrationInterface, QueryRunner } from 'typeorm';

// Reguła projektu: każda nowa wartość LogAction WYMAGA migracji ADD VALUE —
// natywny enum logs_action_enum jest zamrożony przy synchronize=false, a bare
// logAction z nieznaną wartością = 500 po zapisie (patrz logs-action-enum-drift).
export class AddConsentUpdatedLogAction1762540000000 implements MigrationInterface {
    name = 'AddConsentUpdatedLogAction1762540000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "logs_action_enum" ADD VALUE IF NOT EXISTS 'CONSENT_UPDATED'`,
        );
    }

    public async down(): Promise<void> {
        // Postgres nie wspiera usuwania wartości enum — no-op.
    }
}
