import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommunicationsService } from './communications.service';
import { Communication } from './communication.entity';

describe('CommunicationsService', () => {
    let service: CommunicationsService;
    let repo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };

    beforeEach(async () => {
        repo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommunicationsService,
                { provide: getRepositoryToken(Communication), useValue: repo },
            ],
        }).compile();

        service = module.get<CommunicationsService>(CommunicationsService);
    });

    it('create builds and saves a communication', async () => {
        const created = { id: 1 } as Communication;
        repo.create.mockReturnValue(created);
        repo.save.mockResolvedValue(created);

        const result = await service.create(2, 'email', 'hi');

        expect(repo.create).toHaveBeenCalledWith({
            customer: { id: 2 },
            medium: 'email',
            content: 'hi',
        });
        expect(repo.save).toHaveBeenCalledWith(created);
        expect(result).toBe(created);
    });

    it('findForCustomer queries by customer id', async () => {
        repo.find.mockResolvedValue([]);
        await service.findForCustomer(5);
        expect(repo.find).toHaveBeenCalledWith({ where: { customer: { id: 5 } } });
    });
});
