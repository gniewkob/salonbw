import { CustomersController } from './customers.controller';
import { CustomerStatisticsService } from './customer-statistics.service';
import { CustomersService } from './customers.service';
import { CustomerMediaService } from './customer-media.service';

describe('CustomersController', () => {
    let controller: CustomersController;
    let statisticsService: jest.Mocked<CustomerStatisticsService>;

    beforeEach(() => {
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

    it('parses batch ids and delegates to statistics service', async () => {
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
});
