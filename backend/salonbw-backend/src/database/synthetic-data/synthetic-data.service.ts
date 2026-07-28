import type { DataSource, QueryRunner } from 'typeorm';
import type {
    DatasetInput,
    SyntheticDataset,
    SyntheticPlan,
    SyntheticRunConfig,
    SyntheticVerificationExpected,
    SyntheticVerificationReport,
} from './synthetic-data.types';

export interface SyntheticDataDependencies {
    dataSource: Pick<DataSource, 'createQueryRunner'>;
    anchorDate: Date;
    createPasswordHash(): Promise<string>;
    generateDataset(input: DatasetInput): SyntheticDataset;
    buildSyntheticPlan(
        queryRunner: QueryRunner,
        protectedEmails: string[],
        dataset: SyntheticDataset,
    ): Promise<SyntheticPlan>;
    assertProtectedAccounts(plan: SyntheticPlan): void;
    assertResetSchema(queryRunner: QueryRunner): Promise<void>;
    resetOperationalData(
        queryRunner: QueryRunner,
        protectedUserIds: number[],
    ): Promise<Record<string, number>>;
    insertSyntheticDataset(
        queryRunner: QueryRunner,
        dataset: SyntheticDataset,
        context: { ownerUserId: number; clientPasswordHash: string },
    ): Promise<Record<string, number>>;
    verifySyntheticState(
        queryRunner: QueryRunner,
        expected: SyntheticVerificationExpected,
        protectedUserIds: number[],
    ): Promise<SyntheticVerificationReport>;
    cleanupSyntheticData(
        queryRunner: QueryRunner,
    ): Promise<Record<string, number>>;
}

export interface SyntheticCommandReport {
    mode: SyntheticRunConfig['mode'];
    plan: SyntheticPlan;
    mutationCounts?: Record<string, number>;
    insertCounts?: Record<string, number>;
    verification?: SyntheticVerificationReport;
}

const EMPTY_EXPECTED: SyntheticVerificationExpected = {
    clients: 0,
    appointments: 0,
    products: 0,
    warehouseDocuments: 0,
};

function expectedFromDataset(
    dataset: SyntheticDataset,
): SyntheticVerificationExpected {
    return {
        clients: dataset.clients.length,
        appointments: dataset.appointments.length,
        products: dataset.products.length,
        warehouseDocuments:
            dataset.deliveries.length +
            dataset.orders.length +
            dataset.sales.length +
            dataset.usages.length +
            dataset.stocktakings.length,
    };
}

function assertVerification(report: SyntheticVerificationReport): void {
    if (report.blockers.length > 0) {
        throw new Error(report.blockers.join('; '));
    }
}

async function rollbackIfActive(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.isTransactionActive === false) {
        return;
    }
    await queryRunner.rollbackTransaction();
}

export async function runSyntheticDataCommand(
    dependencies: SyntheticDataDependencies,
    config: SyntheticRunConfig,
): Promise<SyntheticCommandReport> {
    const queryRunner = dependencies.dataSource.createQueryRunner();

    try {
        await queryRunner.connect();
        const manifest = dependencies.generateDataset({
            anchorDate: dependencies.anchorDate,
            ownerUserId: 0,
            serviceIds: [0],
        });
        const plan = await dependencies.buildSyntheticPlan(
            queryRunner,
            config.protectedEmails,
            manifest,
        );
        dependencies.assertProtectedAccounts(plan);

        if (config.mode === 'plan') {
            return { mode: config.mode, plan };
        }

        const ownerUserId = plan.ownerUserId;
        if (!ownerUserId) {
            throw new Error('Protected owner account is missing');
        }
        const dataset = dependencies.generateDataset({
            anchorDate: dependencies.anchorDate,
            ownerUserId,
            serviceIds: plan.serviceIds,
        });

        if (config.mode === 'verify') {
            const verification = await dependencies.verifySyntheticState(
                queryRunner,
                expectedFromDataset(dataset),
                plan.protectedUserIds,
            );
            assertVerification(verification);
            return { mode: config.mode, plan, verification };
        }

        await dependencies.assertResetSchema(queryRunner);
        await queryRunner.startTransaction();

        try {
            if (config.mode === 'cleanup') {
                const mutationCounts =
                    await dependencies.cleanupSyntheticData(queryRunner);
                const verification =
                    await dependencies.verifySyntheticState(
                        queryRunner,
                        EMPTY_EXPECTED,
                        plan.protectedUserIds,
                    );
                assertVerification(verification);
                await queryRunner.commitTransaction();
                return {
                    mode: config.mode,
                    plan,
                    mutationCounts,
                    verification,
                };
            }

            const mutationCounts =
                await dependencies.resetOperationalData(
                    queryRunner,
                    plan.protectedUserIds,
                );
            const clientPasswordHash =
                await dependencies.createPasswordHash();
            const insertCounts = await dependencies.insertSyntheticDataset(
                queryRunner,
                dataset,
                { ownerUserId, clientPasswordHash },
            );
            const verification = await dependencies.verifySyntheticState(
                queryRunner,
                expectedFromDataset(dataset),
                plan.protectedUserIds,
            );
            assertVerification(verification);
            await queryRunner.commitTransaction();
            return {
                mode: config.mode,
                plan,
                mutationCounts,
                insertCounts,
                verification,
            };
        } catch (error) {
            await rollbackIfActive(queryRunner);
            throw error;
        }
    } finally {
        await queryRunner.release();
    }
}
