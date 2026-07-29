import type { DataSource, QueryRunner } from 'typeorm';
import type {
    DatasetInput,
    SyntheticBaseContext,
    SyntheticDataset,
    SyntheticPlan,
    SyntheticRunConfig,
    SyntheticScheduleSummary,
    SyntheticScheduleValidationInput,
    SyntheticVerificationExpected,
    SyntheticVerificationReport,
    SyntheticWorkingDay,
} from './synthetic-data.types';

export interface SyntheticDataDependencies {
    dataSource: Pick<DataSource, 'createQueryRunner'>;
    anchorDate: Date;
    createPasswordHash(): Promise<string>;
    loadSyntheticBaseContext(
        queryRunner: QueryRunner,
        protectedEmails: string[],
    ): Promise<SyntheticBaseContext>;
    loadSyntheticWorkingDays(
        queryRunner: QueryRunner,
        ownerUserId: number,
        anchorDate: Date,
    ): Promise<SyntheticWorkingDay[]>;
    generateDataset(input: DatasetInput): SyntheticDataset;
    assertSyntheticScheduleValid(input: SyntheticScheduleValidationInput): void;
    summarizeSyntheticSchedule(
        workingDays: SyntheticWorkingDay[],
    ): Omit<SyntheticScheduleSummary, 'convertedInProgress'>;
    buildSyntheticPlan(
        queryRunner: QueryRunner,
        context: SyntheticBaseContext,
        dataset: SyntheticDataset | null,
        scheduleSummary?: SyntheticScheduleSummary,
    ): Promise<SyntheticPlan>;
    assertProtectedAccounts(input: SyntheticBaseContext | SyntheticPlan): void;
    assertResetSchema(
        queryRunner: QueryRunner,
        protectedUserIds: number[],
    ): Promise<void>;
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
        scheduleContext?: {
            ownerUserId: number;
            anchorDate: Date;
            workingDays: SyntheticWorkingDay[];
        },
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
        const context = await dependencies.loadSyntheticBaseContext(
            queryRunner,
            config.protectedEmails,
        );
        dependencies.assertProtectedAccounts(context);

        if (config.mode === 'cleanup') {
            const plan = await dependencies.buildSyntheticPlan(
                queryRunner,
                context,
                null,
            );
            dependencies.assertProtectedAccounts(plan);
            await dependencies.assertResetSchema(
                queryRunner,
                plan.protectedUserIds,
            );
            await queryRunner.startTransaction();

            try {
                const mutationCounts =
                    await dependencies.cleanupSyntheticData(queryRunner);
                const verification = await dependencies.verifySyntheticState(
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
            } catch (error) {
                await rollbackIfActive(queryRunner);
                throw error;
            }
        }

        const ownerUserId = context.ownerUserId;
        if (!ownerUserId) {
            throw new Error('Protected owner account is missing');
        }
        const workingDays = await dependencies.loadSyntheticWorkingDays(
            queryRunner,
            ownerUserId,
            dependencies.anchorDate,
        );
        const dataset = dependencies.generateDataset({
            anchorDate: dependencies.anchorDate,
            ownerUserId,
            serviceIds: context.serviceIds,
            workingDays,
        });
        dependencies.assertSyntheticScheduleValid({
            appointments: dataset.appointments,
            workingDays,
            ownerUserId,
            anchorDate: dependencies.anchorDate,
        });
        const scheduleSummary = {
            ...dependencies.summarizeSyntheticSchedule(workingDays),
            convertedInProgress: dataset.generationSummary.convertedInProgress,
        };
        const plan = await dependencies.buildSyntheticPlan(
            queryRunner,
            context,
            dataset,
            scheduleSummary,
        );
        dependencies.assertProtectedAccounts(plan);

        if (config.mode === 'plan') {
            return { mode: config.mode, plan };
        }

        const scheduleContext = {
            ownerUserId,
            anchorDate: dependencies.anchorDate,
            workingDays,
        };

        if (config.mode === 'verify') {
            const verification = await dependencies.verifySyntheticState(
                queryRunner,
                expectedFromDataset(dataset),
                plan.protectedUserIds,
                scheduleContext,
            );
            assertVerification(verification);
            return { mode: config.mode, plan, verification };
        }

        await dependencies.assertResetSchema(
            queryRunner,
            plan.protectedUserIds,
        );
        await queryRunner.startTransaction();

        try {
            const mutationCounts = await dependencies.resetOperationalData(
                queryRunner,
                plan.protectedUserIds,
            );
            const clientPasswordHash = await dependencies.createPasswordHash();
            const insertCounts = await dependencies.insertSyntheticDataset(
                queryRunner,
                dataset,
                { ownerUserId, clientPasswordHash },
            );
            const verification = await dependencies.verifySyntheticState(
                queryRunner,
                expectedFromDataset(dataset),
                plan.protectedUserIds,
                scheduleContext,
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
