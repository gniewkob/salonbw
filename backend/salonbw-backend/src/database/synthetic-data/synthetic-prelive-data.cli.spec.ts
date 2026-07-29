import type { DataSource } from 'typeorm';
import {
    main,
    type SyntheticDataCliDependencies,
} from '../../../scripts/synthetic-prelive-data';
import type { SyntheticCommandReport } from './synthetic-data.service';

function createHarness() {
    const dataSource = {
        initialize: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn().mockResolvedValue(undefined),
    } as unknown as DataSource;
    const output: string[] = [];
    const errors: string[] = [];
    const reportFixture = {
        mode: 'plan',
        plan: {
            protectedUserIds: [7, 20],
            protectedAdminPresent: true,
            protectedCiClientPresent: true,
            ownerUserId: 7,
            serviceIds: [10],
            deleteCounts: { clients: 4 },
            createCounts: { clients: 12 },
            blockers: [],
            scheduleSummary: {
                rangeStart: '2026-06-24',
                rangeEnd: '2026-09-27',
                workingDays: 54,
                closedDays: 42,
                convertedInProgress: 4,
            },
            rawTimetableSentinel: {
                label: 'timetable-plan-sentinel',
                startTime: '09:15',
                identity: 'plan-owner@example.invalid',
            },
        },
        verification: {
            actual: {
                clients: 12,
                appointments: 30,
                products: 12,
                warehouseDocuments: 5,
            },
            expected: {
                clients: 12,
                appointments: 30,
                products: 12,
                warehouseDocuments: 5,
            },
            protectedAccountsPresent: 2,
            remainingNonSyntheticClients: 0,
            scheduleViolations: 0,
            blockers: [],
            rawTimetableSentinel: {
                label: 'timetable-verification-sentinel',
                startTime: '18:45',
                identity: 'verification-owner@example.invalid',
            },
        },
    } as unknown as SyntheticCommandReport;
    const dependencies: SyntheticDataCliDependencies = {
        createDataSource: jest.fn().mockReturnValue(dataSource),
        getFileMetadata: jest.fn().mockReturnValue(null),
        runCommand: jest.fn().mockResolvedValue(reportFixture),
        writeOutput: (value) => output.push(value),
        writeError: (value) => errors.push(value),
    };

    return { dataSource, dependencies, output, errors };
}

describe('synthetic pre-live data CLI', () => {
    it('uses plan mode for empty argv and destroys the data source', async () => {
        const { dataSource, dependencies } = createHarness();

        const exitCode = await main([], {}, dependencies);

        expect(exitCode).toBe(0);
        expect(dependencies.runCommand).toHaveBeenCalledWith(
            dataSource,
            expect.objectContaining({ mode: 'plan' }),
        );
        expect(dataSource.destroy).toHaveBeenCalledTimes(1);
    });

    it('outputs aggregate schedule counts without timetable details or identities', async () => {
        const { dependencies, output } = createHarness();

        await main(
            ['plan', '--protect', 'owner@example.invalid'],
            {},
            dependencies,
        );

        const serialized = output.join('');
        const publicReport = JSON.parse(serialized) as {
            plan: Record<string, unknown> & {
                scheduleSummary: {
                    rangeStart: string;
                    rangeEnd: string;
                    workingDays: number;
                    closedDays: number;
                    convertedInProgress: number;
                };
            };
            verification: Record<string, unknown> & {
                scheduleViolations: number;
            };
        };
        expect(serialized).toContain('"clients": 12');
        expect(Object.keys(publicReport.plan).sort()).toEqual([
            'blockers',
            'createCounts',
            'deleteCounts',
            'protectedAdminPresent',
            'protectedCiClientPresent',
            'scheduleSummary',
        ]);
        expect(Object.keys(publicReport.verification).sort()).toEqual([
            'actual',
            'blockers',
            'expected',
            'protectedAccountsPresent',
            'remainingNonSyntheticClients',
            'scheduleViolations',
        ]);
        expect(publicReport.plan.scheduleSummary).toEqual({
            rangeStart: '2026-06-24',
            rangeEnd: '2026-09-27',
            workingDays: 54,
            closedDays: 42,
            convertedInProgress: 4,
        });
        expect(publicReport.verification.scheduleViolations).toBe(0);
        expect(serialized).not.toMatch(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/);
        expect(serialized).not.toContain('rawTimetableSentinel');
        expect(serialized).not.toContain('owner@example.invalid');
        expect(serialized).not.toContain('plan-owner@example.invalid');
        expect(serialized).not.toContain('verification-owner@example.invalid');
        expect(serialized).not.toContain('timetable-plan-sentinel');
        expect(serialized).not.toContain('timetable-verification-sentinel');
        expect(serialized).not.toContain('timetable');
    });

    it('returns one and redacts identities and connection credentials', async () => {
        const { dataSource, dependencies, errors } = createHarness();
        (dependencies.runCommand as jest.Mock).mockRejectedValue(
            new Error(
                'failed for owner@example.invalid at postgres://dbuser:dbsecret@db.internal/salon',
            ),
        );

        const exitCode = await main([], {}, dependencies);

        expect(exitCode).toBe(1);
        expect(errors.join('')).toContain('[EMAIL]');
        expect(errors.join('')).toContain('postgres://[REDACTED]@');
        expect(errors.join('')).not.toContain('owner@example.invalid');
        expect(errors.join('')).not.toContain('dbsecret');
        expect(dataSource.destroy).toHaveBeenCalledTimes(1);
    });

    it('prints help without creating a database connection', async () => {
        const { dependencies, output } = createHarness();

        const exitCode = await main(['--help'], {}, dependencies);

        expect(exitCode).toBe(0);
        expect(output.join('')).toContain('SYNTHETIC_DATA_ALLOWED');
        expect(dependencies.createDataSource).not.toHaveBeenCalled();
    });
});
