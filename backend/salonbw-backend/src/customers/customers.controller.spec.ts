import { CustomersController } from './customers.controller';
import { CustomerStatisticsService } from './customer-statistics.service';
import { CustomersService } from './customers.service';
import { CustomerMediaService } from './customer-media.service';

describe('CustomersController', () => {
    let controller: CustomersController;
    let statisticsService: jest.Mocked<CustomerStatisticsService>;
    let dateNowSpy: jest.SpyInstance<number, []>;

    beforeEach(() => {
        dateNowSpy = jest.spyOn(Date, 'now');
        statisticsService = {
            getStatisticsBatch: jest
                .fn()
                .mockResolvedValue([{ customerId: 1, statistics: null }]),
        } as unknown as jest.Mocked<CustomerStatisticsService>;

        const customersService = {} as CustomersService;
        const mediaService = {} as CustomerMediaService;

        controller = new CustomersController(
            customersService,
            statisticsService,
            mediaService,
        );
    });

    afterEach(() => {
        dateNowSpy.mockRestore();
    });

    it('parses batch ids and delegates to statistics service', async () => {
        dateNowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1100);
        await expect(
            controller.getStatisticsBatch(
                '1, 2, abc, 0, 2, -1',
                '2026-05-01',
                '2026-05-31',
            ),
        ).resolves.toEqual({
            items: [{ customerId: 1, statistics: null }],
        });

        expect(statisticsService.getStatisticsBatch).toHaveBeenCalledWith(
            [1, 2],
            {
                from: '2026-05-01',
                to: '2026-05-31',
            },
            'full',
        );
    });

    it('passes alerts scope for batch request when provided', async () => {
        dateNowSpy.mockReturnValueOnce(2000).mockReturnValueOnce(2050);
        await controller.getStatisticsBatch(
            '7,8',
            undefined,
            undefined,
            'alerts',
        );

        expect(statisticsService.getStatisticsBatch).toHaveBeenCalledWith(
            [7, 8],
            {
                from: undefined,
                to: undefined,
            },
            'alerts',
        );
    });

    it('limits ids to max batch size and logs normalization warning', async () => {
        dateNowSpy.mockReturnValueOnce(3000).mockReturnValueOnce(3050);
        const warnSpy = jest.fn();
        (controller as unknown as { logger: { warn: jest.Mock } }).logger.warn =
            warnSpy;

        const ids = Array.from(
            { length: 120 },
            (_, index) => `${index + 1}`,
        ).join(',');
        await controller.getStatisticsBatch(
            ids,
            undefined,
            undefined,
            'alerts',
        );

        expect(statisticsService.getStatisticsBatch).toHaveBeenCalledWith(
            Array.from({ length: 100 }, (_, index) => index + 1),
            {
                from: undefined,
                to: undefined,
            },
            'alerts',
        );
        expect(warnSpy).toHaveBeenCalledWith(
            'customer statistics batch ids normalized',
            expect.objectContaining({
                rawTokenCount: 120,
                uniqueCount: 100,
                scope: 'alerts',
            }),
        );
    });

    it('logs batch telemetry for non-slow requests', async () => {
        dateNowSpy.mockReturnValueOnce(4000).mockReturnValueOnce(4200);
        const logSpy = jest.fn();
        const warnSpy = jest.fn();
        (
            controller as unknown as {
                logger: { log: jest.Mock; warn: jest.Mock };
            }
        ).logger.log = logSpy;
        (
            controller as unknown as {
                logger: { log: jest.Mock; warn: jest.Mock };
            }
        ).logger.warn = warnSpy;

        await controller.getStatisticsBatch(
            '1,2,3',
            undefined,
            undefined,
            'alerts',
        );

        expect(logSpy).toHaveBeenCalledWith(
            'customer statistics batch served',
            expect.objectContaining({
                idsCount: 3,
                scope: 'alerts',
                durationMs: 200,
                resultCount: 1,
            }),
        );
        expect(warnSpy).not.toHaveBeenCalledWith(
            'customer statistics batch slow',
            expect.anything(),
        );
    });

    it('logs slow batch telemetry as warning', async () => {
        dateNowSpy.mockReturnValueOnce(5000).mockReturnValueOnce(6005);
        const warnSpy = jest.fn();
        (
            controller as unknown as {
                logger: { warn: jest.Mock };
            }
        ).logger.warn = warnSpy;

        await controller.getStatisticsBatch(
            '1,2,3,4',
            undefined,
            undefined,
            'alerts',
        );

        expect(warnSpy).toHaveBeenCalledWith(
            'customer statistics batch slow',
            expect.objectContaining({
                idsCount: 4,
                scope: 'alerts',
                durationMs: 1005,
                resultCount: 1,
            }),
        );
    });

    it('logs failure telemetry for batch request errors and rethrows', async () => {
        dateNowSpy.mockReturnValueOnce(7000).mockReturnValueOnce(7600);
        const warnSpy = jest.fn();
        (
            controller as unknown as {
                logger: { warn: jest.Mock };
            }
        ).logger.warn = warnSpy;
        statisticsService.getStatisticsBatch.mockRejectedValueOnce(
            new Error('Batch failure'),
        );

        await expect(
            controller.getStatisticsBatch(
                '1,2,3',
                undefined,
                undefined,
                'alerts',
            ),
        ).rejects.toThrow('Batch failure');

        expect(warnSpy).toHaveBeenCalledWith(
            'customer statistics batch failed',
            expect.objectContaining({
                idsCount: 3,
                scope: 'alerts',
                durationMs: 600,
                errorType: 'Error',
            }),
        );
    });
});
