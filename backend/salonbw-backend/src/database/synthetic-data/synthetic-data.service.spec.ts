import type { DataSource, QueryRunner } from 'typeorm';
import type {
    SyntheticBaseContext,
    SyntheticDataset,
    SyntheticPlan,
    SyntheticRunConfig,
    SyntheticVerificationReport,
    SyntheticWorkingDay,
} from './synthetic-data.types';
import {
    runSyntheticDataCommand,
    type SyntheticDataDependencies,
} from './synthetic-data.service';
import { generateSyntheticDataset } from './synthetic-data.dataset';

const plan: SyntheticPlan = {
    protectedUserIds: [7, 20],
    protectedAdminPresent: true,
    protectedCiClientPresent: true,
    ownerUserId: 7,
    serviceIds: [10],
    deleteCounts: {
        clients: 2,
        appointments: 3,
        products: 4,
        warehouseDocuments: 5,
    },
    createCounts: {
        clients: 12,
        appointments: 30,
        products: 12,
        warehouseDocuments: 5,
    },
    blockers: [],
    scheduleSummary: {
        rangeStart: '2026-06-24',
        rangeEnd: '2026-09-27',
        workingDays: 96,
        closedDays: 0,
        convertedInProgress: 4,
    },
};

const context: SyntheticBaseContext = {
    protectedUserIds: plan.protectedUserIds,
    protectedAdminPresent: plan.protectedAdminPresent,
    protectedCiClientPresent: plan.protectedCiClientPresent,
    ownerUserId: plan.ownerUserId,
    serviceIds: plan.serviceIds,
    blockers: [],
};

const verification: SyntheticVerificationReport = {
    actual: plan.createCounts as SyntheticVerificationReport['actual'],
    expected: plan.createCounts as SyntheticVerificationReport['expected'],
    protectedAccountsPresent: 2,
    remainingNonSyntheticClients: 0,
    scheduleViolations: 0,
    blockers: [],
};

const configs: Record<SyntheticRunConfig['mode'], SyntheticRunConfig> = {
    plan: {
        mode: 'plan',
        protectedEmails: ['owner@example.invalid', 'ci@example.invalid'],
        reportJson: false,
    },
    apply: {
        mode: 'apply',
        protectedEmails: ['owner@example.invalid', 'ci@example.invalid'],
        backupFile: '/tmp/backup.dump',
        reportJson: false,
    },
    verify: {
        mode: 'verify',
        protectedEmails: ['owner@example.invalid', 'ci@example.invalid'],
        reportJson: false,
    },
    cleanup: {
        mode: 'cleanup',
        protectedEmails: ['owner@example.invalid', 'ci@example.invalid'],
        backupFile: '/tmp/backup.dump',
        reportJson: false,
    },
};

function dateKeyAtOffset(date: string, offset: number): string {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + offset))
        .toISOString()
        .slice(0, 10);
}

const workingDays: SyntheticWorkingDay[] = Array.from(
    { length: 96 },
    (_, index) => ({
        date: dateKeyAtOffset('2026-06-24', index),
        ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
    }),
);

function createHarness(callOrder?: string[]) {
    const queryRunner = {
        connect: jest.fn().mockImplementation(async () => {
            callOrder?.push('connect');
        }),
        release: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;
    const dataset = {
        anchorDate: new Date('2026-07-28T00:00:00+02:00'),
        generationSummary: { convertedInProgress: 4 },
        clients: Array(12),
        appointments: Array(30),
        products: Array(12),
        deliveries: Array(1),
        orders: Array(1),
        sales: Array(1),
        usages: Array(1),
        stocktakings: Array(1),
    } as SyntheticDataset;
    const deps: SyntheticDataDependencies = {
        dataSource: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as unknown as DataSource,
        anchorDate: new Date('2026-07-28T12:00:00+02:00'),
        createPasswordHash: jest.fn().mockResolvedValue('synthetic-hash'),
        loadSyntheticBaseContext: jest.fn().mockImplementation(async () => {
            callOrder?.push('load-base-context');
            return context;
        }),
        loadSyntheticWorkingDays: jest.fn().mockImplementation(async () => {
            callOrder?.push('load-working-days');
            return workingDays;
        }),
        generateDataset: jest.fn().mockImplementation(() => {
            callOrder?.push('generate-dataset');
            return dataset;
        }),
        assertSyntheticScheduleValid: jest.fn().mockImplementation(() => {
            callOrder?.push('validate-schedule');
        }),
        summarizeSyntheticSchedule: jest.fn().mockImplementation(() => {
            callOrder?.push('summarize-schedule');
            return {
                rangeStart: '2026-06-24',
                rangeEnd: '2026-09-27',
                workingDays: 96,
                closedDays: 0,
            };
        }),
        buildSyntheticPlan: jest.fn().mockImplementation(async () => {
            callOrder?.push('build-plan');
            return plan;
        }),
        assertProtectedAccounts: jest.fn().mockImplementation((input) => {
            callOrder?.push(
                input === context
                    ? 'assert-base-context'
                    : 'assert-built-plan',
            );
        }),
        assertResetSchema: jest.fn().mockResolvedValue(undefined),
        resetOperationalData: jest
            .fn()
            .mockResolvedValue({ users: 2, appointments: 3 }),
        insertSyntheticDataset: jest
            .fn()
            .mockResolvedValue(plan.createCounts),
        verifySyntheticState: jest.fn().mockResolvedValue(verification),
        cleanupSyntheticData: jest
            .fn()
            .mockResolvedValue({ users: 12, appointments: 30 }),
    };

    return { queryRunner, deps };
}

describe('synthetic data service', () => {
    it('loads and validates the schedule before building a plan', async () => {
        const callOrder: string[] = [];
        const { deps } = createHarness(callOrder);

        await runSyntheticDataCommand(deps, configs.plan);

        expect(callOrder).toEqual([
            'connect',
            'load-base-context',
            'assert-base-context',
            'load-working-days',
            'generate-dataset',
            'validate-schedule',
            'summarize-schedule',
            'build-plan',
            'assert-built-plan',
        ]);
    });

    it('never starts a transaction or writes for plan', async () => {
        const { queryRunner, deps } = createHarness();

        const report = await runSyntheticDataCommand(deps, configs.plan);

        expect(report.mode).toBe('plan');
        expect(queryRunner.startTransaction).not.toHaveBeenCalled();
        expect(deps.resetOperationalData).not.toHaveBeenCalled();
        expect(deps.insertSyntheticDataset).not.toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('builds a read-only plan with the real validated generator', async () => {
        const { deps } = createHarness();
        deps.generateDataset = generateSyntheticDataset;

        await expect(
            runSyntheticDataCommand(deps, configs.plan),
        ).resolves.toMatchObject({ mode: 'plan' });
    });

    it('does not start a transaction when schedule validation fails', async () => {
        const { queryRunner, deps } = createHarness();
        (deps.assertSyntheticScheduleValid as jest.Mock).mockImplementation(
            () => {
                throw new Error('SYNTHETIC_SCHEDULE_OUTSIDE_WORKING_HOURS');
            },
        );

        await expect(
            runSyntheticDataCommand(deps, configs.apply),
        ).rejects.toThrow('SYNTHETIC_SCHEDULE_OUTSIDE_WORKING_HOURS');
        expect(queryRunner.startTransaction).not.toHaveBeenCalled();
        expect(deps.resetOperationalData).not.toHaveBeenCalled();
        expect(deps.insertSyntheticDataset).not.toHaveBeenCalled();
    });

    it('commits apply only after successful verification', async () => {
        const { queryRunner, deps } = createHarness();

        const report = await runSyntheticDataCommand(deps, configs.apply);

        expect(report.mode).toBe('apply');
        expect(deps.assertResetSchema).toHaveBeenCalledTimes(1);
        expect(deps.assertResetSchema).toHaveBeenCalledWith(
            queryRunner,
            plan.protectedUserIds,
        );
        expect(deps.resetOperationalData).toHaveBeenCalledTimes(1);
        expect(deps.insertSyntheticDataset).toHaveBeenCalledTimes(1);
        expect(deps.verifySyntheticState).toHaveBeenCalledTimes(1);
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('rolls back when inserted database rows violate the schedule', async () => {
        const { queryRunner, deps } = createHarness();
        const scheduleBlockerVerification: SyntheticVerificationReport = {
            ...verification,
            scheduleViolations: 1,
            blockers: ['SYNTHETIC_SCHEDULE_OUTSIDE_WORKING_HOURS'],
        };
        (deps.verifySyntheticState as jest.Mock).mockImplementation(
            async (
                _queryRunner,
                _expected,
                _protectedUserIds,
                scheduleContext,
            ) =>
                scheduleContext
                    ? scheduleBlockerVerification
                    : verification,
        );

        await expect(
            runSyntheticDataCommand(deps, configs.apply),
        ).rejects.toThrow('SYNTHETIC_SCHEDULE_OUTSIDE_WORKING_HOURS');
        expect(deps.verifySyntheticState).toHaveBeenCalledWith(
            queryRunner,
            plan.createCounts,
            plan.protectedUserIds,
            {
                ownerUserId: context.ownerUserId,
                anchorDate: deps.anchorDate,
                workingDays,
            },
        );
        expect(
            (deps.insertSyntheticDataset as jest.Mock).mock
                .invocationCallOrder[0],
        ).toBeLessThan(
            (deps.verifySyntheticState as jest.Mock).mock.invocationCallOrder[0],
        );
        expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('runs verify without a transaction or writes', async () => {
        const { queryRunner, deps } = createHarness();

        const report = await runSyntheticDataCommand(deps, configs.verify);

        expect(report.verification).toEqual(verification);
        expect(queryRunner.startTransaction).not.toHaveBeenCalled();
        expect(deps.verifySyntheticState).toHaveBeenCalledTimes(1);
        expect(deps.resetOperationalData).not.toHaveBeenCalled();
    });

    it('cleans only synthetic records in a transaction', async () => {
        const { queryRunner, deps } = createHarness();
        const emptyVerification: SyntheticVerificationReport = {
            ...verification,
            actual: {
                clients: 0,
                appointments: 0,
                products: 0,
                warehouseDocuments: 0,
            },
            expected: {
                clients: 0,
                appointments: 0,
                products: 0,
                warehouseDocuments: 0,
            },
        };
        (deps.verifySyntheticState as jest.Mock).mockResolvedValue(
            emptyVerification,
        );

        const report = await runSyntheticDataCommand(deps, configs.cleanup);

        expect(report.mode).toBe('cleanup');
        expect(deps.loadSyntheticWorkingDays).not.toHaveBeenCalled();
        expect(deps.generateDataset).not.toHaveBeenCalled();
        expect(deps.cleanupSyntheticData).toHaveBeenCalledTimes(1);
        expect(deps.resetOperationalData).not.toHaveBeenCalled();
        expect(deps.insertSyntheticDataset).not.toHaveBeenCalled();
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
});
