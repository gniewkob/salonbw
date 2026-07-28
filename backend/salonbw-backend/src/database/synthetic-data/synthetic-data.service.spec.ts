import type { DataSource, QueryRunner } from 'typeorm';
import type {
    SyntheticDataset,
    SyntheticPlan,
    SyntheticRunConfig,
    SyntheticVerificationReport,
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
};

const verification: SyntheticVerificationReport = {
    actual: plan.createCounts as SyntheticVerificationReport['actual'],
    expected: plan.createCounts as SyntheticVerificationReport['expected'],
    protectedAccountsPresent: 2,
    remainingNonSyntheticClients: 0,
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

function createHarness() {
    const queryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    } as unknown as QueryRunner;
    const dataset = {
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
        generateDataset: jest.fn().mockReturnValue(dataset),
        buildSyntheticPlan: jest.fn().mockResolvedValue(plan),
        assertProtectedAccounts: jest.fn(),
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

    it('commits apply only after successful verification', async () => {
        const { queryRunner, deps } = createHarness();

        const report = await runSyntheticDataCommand(deps, configs.apply);

        expect(report.mode).toBe('apply');
        expect(deps.assertResetSchema).toHaveBeenCalledTimes(1);
        expect(deps.resetOperationalData).toHaveBeenCalledTimes(1);
        expect(deps.insertSyntheticDataset).toHaveBeenCalledTimes(1);
        expect(deps.verifySyntheticState).toHaveBeenCalledTimes(1);
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('rolls back when insert verification fails', async () => {
        const { queryRunner, deps } = createHarness();
        (deps.verifySyntheticState as jest.Mock).mockRejectedValue(
            new Error('count mismatch'),
        );

        await expect(
            runSyntheticDataCommand(deps, configs.apply),
        ).rejects.toThrow('count mismatch');
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
        expect(deps.cleanupSyntheticData).toHaveBeenCalledTimes(1);
        expect(deps.resetOperationalData).not.toHaveBeenCalled();
        expect(deps.insertSyntheticDataset).not.toHaveBeenCalled();
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
});
