import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: jest.Mocked<CommissionsService>;

  beforeEach(() => {
    service = {
      findForUser: jest.fn().mockResolvedValue(['mine'] as any),
      findAll: jest.fn().mockResolvedValue(['all'] as any),
    } as any;
    controller = new CommissionsController(service);
  });

  it('delegates findMine to service', async () => {
    await expect(controller.findMine({ userId: 1 })).resolves.toEqual(['mine']);
    expect(service.findForUser).toHaveBeenCalledWith(1);
  });

  it('delegates findAll to service', async () => {
    await expect(controller.findAll()).resolves.toEqual(['all']);
    expect(service.findAll).toHaveBeenCalled();
  });
});

