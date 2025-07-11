import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from './role.enum';
import { Repository } from 'typeorm';

describe('UsersService', () => {
    let service: UsersService;
    let repo: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('findByEmail resolves a user object for a provided email', async () => {
        const user = { id: 1, email: 'a@test.com' } as User;
        repo.findOne.mockResolvedValue(user);

        await expect(service.findByEmail('a@test.com')).resolves.toEqual(user);
        expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@test.com' } });
    });

    it('createUser hashes the password before calling save', async () => {
        const plain = 'secret';
        const created = { email: 'a@test.com', password: 'hashed', name: 'A', role: Role.Client } as User;
        repo.create.mockReturnValue(created);
        repo.save.mockResolvedValue(created);

        await service.createUser('a@test.com', plain, 'A', Role.Client);

        const passed = repo.create.mock.calls[0][0].password;
        expect(await bcrypt.compare(plain, passed)).toBe(true);
        expect(repo.save).toHaveBeenCalledWith(created);
    });
});
