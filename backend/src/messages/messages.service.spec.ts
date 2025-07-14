import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { Message } from './message.entity';

describe('MessagesService', () => {
  let service: MessagesService;
  let repo: { create: jest.Mock; save: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService, { provide: getRepositoryToken(Message), useValue: repo }],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('create saves a new message', async () => {
    const msg = { id: 1 } as Message;
    repo.create.mockReturnValue(msg);
    repo.save.mockResolvedValue(msg);

    const result = await service.create(1, 2, 'hello');

    expect(repo.create).toHaveBeenCalledWith({
      sender: { id: 1 },
      recipient: { id: 2 },
      content: 'hello',
    });
    expect(repo.save).toHaveBeenCalledWith(msg);
    expect(result).toBe(msg);
  });

  it('findForUser queries for both sender and recipient', async () => {
    repo.find.mockResolvedValue([]);
    await service.findForUser(3);
    expect(repo.find).toHaveBeenCalledWith({
      where: [
        { sender: { id: 3 } },
        { recipient: { id: 3 } },
      ],
      order: { id: 'ASC' },
    });
  });
});
