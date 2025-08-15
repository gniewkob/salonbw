import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { Commission } from './commission.entity';

describe('CommissionsController', () => {
    let controller: CommissionsController;
    let service: jest.Mocked<CommissionsService>;
    let mine: Commission;
    let all: Commission;

    beforeEach(() => {
        mine = { id: 1 } as Commission;
        all = { id: 2 } as Commission;
        service = {
            findForUser: jest.fn().mockResolvedValue([mine]),
            findAll: jest.fn().mockResolvedValue([all]),
            sumForUser: jest.fn().mockResolvedValue(10),
        } as jest.Mocked<CommissionsService>;
        controller = new CommissionsController(service);
    });

    it('delegates findMine to service', async () => {
        const findForUserSpy = jest.spyOn(service, 'findForUser');
        await expect(controller.findMine({ userId: 1 })).resolves.toEqual([
            mine,
        ]);
        expect(findForUserSpy).toHaveBeenCalledWith(1);
    });

    it('delegates findForEmployee to service', async () => {
        const findForUserSpy = jest.spyOn(service, 'findForUser');
        await expect(controller.findForEmployee(2)).resolves.toEqual([mine]);
        expect(findForUserSpy).toHaveBeenCalledWith(2);
    });

    it('delegates getSummaryForEmployee to service', async () => {
        const sumSpy = jest.spyOn(service, 'sumForUser');
        await expect(
            controller.getSummaryForEmployee(
                1,
                '2024-01-01',
                '2024-01-31',
            ),
        ).resolves.toEqual({ amount: 10 });
        expect(sumSpy).toHaveBeenCalledWith(
            1,
            new Date('2024-01-01'),
            new Date('2024-01-31'),
        );
    });

    it('delegates findAll to service', async () => {
        const findAllSpy = jest.spyOn(service, 'findAll');
        await expect(controller.findAll()).resolves.toEqual([all]);
        expect(findAllSpy).toHaveBeenCalled();
    });
});
