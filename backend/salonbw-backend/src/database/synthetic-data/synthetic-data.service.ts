import type { DataSource, QueryRunner } from 'typeorm';
import type {
    DatasetInput,
    SyntheticBaseContext,
    SyntheticDateRange,
    SyntheticDataset,
    SyntheticPlan,
    SyntheticRunConfig,
    SyntheticScheduleSummary,
    SyntheticScheduleValidationInput,
    SyntheticVerificationExpected,
    SyntheticVerificationReport,
    SyntheticVerificationScheduleContext,
    SyntheticWorkingDay,
} from './synthetic-data.types';

export interface SyntheticDataDependencies {
    dataSource: Pick<DataSource, 'createQueryRunner'>;
    anchorDate: Date;
    createPasswordHash(): Promise<string>;
    loadSyntheticAppointmentDateRange(
        queryRunner: QueryRunner,
    ): Promise<SyntheticDateRange | null>;
    loadSyntheticBaseContext(
        queryRunner: QueryRunner,
        protectedEmails: string[],
    ): Promise<SyntheticBaseContext>;
    loadSyntheticWorkingDays(
        queryRunner: QueryRunner,
        ownerUserId: number,
        anchorDate: Date,
        dateRange?: SyntheticDateRange,
    ): Promise<SyntheticWorkingDay[]>;
    lockSyntheticSchedule(queryRunner: QueryRunner): Promise<void>;
    generateDataset(input: DatasetInput): SyntheticDataset;
    assertSyntheticScheduleValid(input: SyntheticScheduleValidationInput): void;
    summarizeSyntheticSchedule(
        workingDays: SyntheticWorkingDay[],
    ): Omit<SyntheticScheduleSummary, 'convertedInProgress'>;
    buildSyntheticPlan(
        queryRunner: QueryRunner,
        context: SyntheticBaseContext,
        expectedCreateCounts: SyntheticVerificationExpected,
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
        scheduleContext?: SyntheticVerificationScheduleContext,
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
const EXPECTED_SYNTHETIC_STATE: SyntheticVerificationExpected = {
    clients: 12,
    appointments: 30,
    products: 12,
    warehouseDocuments: 5,
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

interface PreparedSyntheticData {
    context: SyntheticBaseContext;
    ownerUserId: number;
    workingDays: SyntheticWorkingDay[];
    dataset: SyntheticDataset;
    plan: SyntheticPlan;
}

async function prepareSyntheticData(
    dependencies: SyntheticDataDependencies,
    queryRunner: QueryRunner,
    context: SyntheticBaseContext,
): Promise<PreparedSyntheticData> {
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
        expectedFromDataset(dataset),
        scheduleSummary,
    );
    dependencies.assertProtectedAccounts(plan);
    return { context, ownerUserId, workingDays, dataset, plan };
}

async function runStandaloneVerify(
    dependencies: SyntheticDataDependencies,
    queryRunner: QueryRunner,
    config: SyntheticRunConfig,
): Promise<SyntheticCommandReport> {
    await queryRunner.startTransaction('REPEATABLE READ');
    try {
        await queryRunner.query('SET TRANSACTION READ ONLY');
        const context = await dependencies.loadSyntheticBaseContext(
            queryRunner,
            config.protectedEmails,
        );
        dependencies.assertProtectedAccounts(context);
        const ownerUserId = context.ownerUserId;
        if (!ownerUserId) {
            throw new Error('Protected owner account is missing');
        }
        const dateRange =
            await dependencies.loadSyntheticAppointmentDateRange(queryRunner);
        const workingDays = dateRange
            ? await dependencies.loadSyntheticWorkingDays(
                  queryRunner,
                  ownerUserId,
                  dependencies.anchorDate,
                  dateRange,
              )
            : [];
        const plan = await dependencies.buildSyntheticPlan(
            queryRunner,
            context,
            EXPECTED_SYNTHETIC_STATE,
        );
        dependencies.assertProtectedAccounts(plan);
        const verification = await dependencies.verifySyntheticState(
            queryRunner,
            EXPECTED_SYNTHETIC_STATE,
            plan.protectedUserIds,
            {
                ownerUserId,
                anchorDate: dependencies.anchorDate,
                workingDays,
                validateStatusTime: false,
            },
        );
        assertVerification(verification);
        await queryRunner.commitTransaction();
        return { mode: config.mode, plan, verification };
    } catch (error) {
        await rollbackIfActive(queryRunner);
        throw error;
    }
}

export async function runSyntheticDataCommand(
    dependencies: SyntheticDataDependencies,
    config: SyntheticRunConfig,
): Promise<SyntheticCommandReport> {
    const queryRunner = dependencies.dataSource.createQueryRunner();

    try {
        await queryRunner.connect();
        if (config.mode === 'verify') {
            return await runStandaloneVerify(dependencies, queryRunner, config);
        }

        const context = await dependencies.loadSyntheticBaseContext(
            queryRunner,
            config.protectedEmails,
        );
        dependencies.assertProtectedAccounts(context);

        if (config.mode === 'cleanup') {
            const plan = await dependencies.buildSyntheticPlan(
                queryRunner,
                context,
                EMPTY_EXPECTED,
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

        const preflight = await prepareSyntheticData(
            dependencies,
            queryRunner,
            context,
        );

        if (config.mode === 'plan') {
            return { mode: config.mode, plan: preflight.plan };
        }

        await dependencies.assertResetSchema(
            queryRunner,
            preflight.plan.protectedUserIds,
        );
        await queryRunner.startTransaction();

        try {
            await dependencies.lockSyntheticSchedule(queryRunner);
            const lockedContext = await dependencies.loadSyntheticBaseContext(
                queryRunner,
                config.protectedEmails,
            );
            dependencies.assertProtectedAccounts(lockedContext);
            const locked = await prepareSyntheticData(
                dependencies,
                queryRunner,
                lockedContext,
            );
            const mutationCounts = await dependencies.resetOperationalData(
                queryRunner,
                locked.plan.protectedUserIds,
            );
            const clientPasswordHash = await dependencies.createPasswordHash();
            const insertCounts = await dependencies.insertSyntheticDataset(
                queryRunner,
                locked.dataset,
                {
                    ownerUserId: locked.ownerUserId,
                    clientPasswordHash,
                },
            );
            const verification = await dependencies.verifySyntheticState(
                queryRunner,
                expectedFromDataset(locked.dataset),
                locked.plan.protectedUserIds,
                {
                    ownerUserId: locked.ownerUserId,
                    anchorDate: dependencies.anchorDate,
                    workingDays: locked.workingDays,
                },
            );
            assertVerification(verification);
            await queryRunner.commitTransaction();
            return {
                mode: config.mode,
                plan: locked.plan,
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
