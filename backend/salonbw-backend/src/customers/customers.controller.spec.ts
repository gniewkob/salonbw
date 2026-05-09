import { CustomersController } from './customers.controller';
import { CustomerStatisticsService } from './customer-statistics.service';
import { CustomersService } from './customers.service';
import { CustomerMediaService } from './customer-media.service';
import { BadRequestException } from '@nestjs/common';

describe('CustomersController', () => {
    let controller: CustomersController;
    let statisticsService: jest.Mocked<CustomerStatisticsService>;
    let dateNowSpy: jest.SpyInstance<number, []>;
    const originalNodeEnv = process.env.NODE_ENV;

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
        process.env.NODE_ENV = originalNodeEnv;
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
        dateNowSpy
            .mockReturnValueOnce(7000)
            .mockReturnValueOnce(7600)
            .mockReturnValueOnce(7600);
        const warnSpy = jest.fn();
        const errorSpy = jest.fn();
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.warn = warnSpy;
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.error = errorSpy;
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

        expect(errorSpy).toHaveBeenCalledWith(
            'customer statistics batch failed',
            expect.objectContaining({
                idsCount: 3,
                scope: 'alerts',
                durationMs: 600,
                errorType: 'Error',
            }),
        );
    });

    it('logs controlled 4xx failures as warning', async () => {
        dateNowSpy
            .mockReturnValueOnce(9000)
            .mockReturnValueOnce(9100)
            .mockReturnValueOnce(9100);
        const warnSpy = jest.fn();
        const errorSpy = jest.fn();
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.warn = warnSpy;
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.error = errorSpy;
        statisticsService.getStatisticsBatch.mockRejectedValueOnce(
            new BadRequestException('Invalid ids'),
        );

        await expect(
            controller.getStatisticsBatch(
                '1,2,3',
                undefined,
                undefined,
                'alerts',
            ),
        ).rejects.toThrow('Invalid ids');

        expect(warnSpy).toHaveBeenCalledWith(
            'customer statistics batch failed',
            expect.objectContaining({
                idsCount: 3,
                scope: 'alerts',
                durationMs: 100,
                errorType: 'BadRequestException',
            }),
        );
        expect(errorSpy).not.toHaveBeenCalledWith(
            'customer statistics batch failed',
            expect.anything(),
        );
    });

    it('logs failure burst when threshold is exceeded', async () => {
        const warnSpy = jest.fn();
        const errorSpy = jest.fn();
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.warn = warnSpy;
        (
            controller as unknown as {
                logger: { warn: jest.Mock; error: jest.Mock };
            }
        ).logger.error = errorSpy;

        for (let index = 0; index < 5; index += 1) {
            const now = 10000 + index * 100;
            dateNowSpy
                .mockReturnValueOnce(now)
                .mockReturnValueOnce(now + 20)
                .mockReturnValueOnce(now + 20);
            statisticsService.getStatisticsBatch.mockRejectedValueOnce(
                new Error(`Batch failure ${index}`),
            );

            await expect(
                controller.getStatisticsBatch(
                    '1,2,3',
                    undefined,
                    undefined,
                    'alerts',
                ),
            ).rejects.toThrow(`Batch failure ${index}`);
        }

        expect(errorSpy).toHaveBeenCalledWith(
            'customer statistics batch failure burst',
            expect.objectContaining({
                windowMs: 5 * 60 * 1000,
                threshold: 5,
                recentFailures: 5,
                scope: 'alerts',
            }),
        );
    });

    it('does not log fast success telemetry in production', async () => {
        process.env.NODE_ENV = 'production';
        dateNowSpy.mockReturnValueOnce(8000).mockReturnValueOnce(8100);
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
            '1,2',
            undefined,
            undefined,
            'alerts',
        );

        expect(warnSpy).not.toHaveBeenCalledWith(
            'customer statistics batch slow',
            expect.anything(),
        );
        expect(logSpy).not.toHaveBeenCalledWith(
            'customer statistics batch served',
            expect.anything(),
        );
    });
});
