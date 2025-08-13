import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { Commission } from './commission.entity';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: jest.Mocked<CommissionsService>;
  let mine: Commission;
  let all: Commission;

  beforeEach(() => {
    mine = {} as Commission;
    all = {} as Commission;
    service = {
      findForUser: jest.fn().mockResolvedValue([mine]),
      findAll: jest.fn().mockResolvedValue([all]),
    } as unknown as jest.Mocked<CommissionsService>;
    controller = new CommissionsController(service);
  });

  it('delegates findMine to service', async () => {
    const findMine = (dto: { userId: number }) => controller.findMine(dto);
    await expect(findMine({ userId: 1 })).resolves.toEqual([mine]);
    const { findForUser } = service;
    expect(findForUser).toHaveBeenCalledWith(1);
  });

  it('delegates findAll to service', async () => {
    const findAll = () => controller.findAll();
    await expect(findAll()).resolves.toEqual([all]);
    const { findAll: findAllSvc } = service;
    expect(findAllSvc).toHaveBeenCalled();
  });
});

