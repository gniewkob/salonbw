import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

describe('UsersService', () => {
    let service: UsersService;
    let repo: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repo = module.get(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('hashes the password, sets default role and saves user', async () => {
            const dto: CreateUserDto = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'plainPass',
            };
            (repo.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPass');
            const created = {
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
            };
            (repo.create as jest.Mock).mockReturnValue(created);
            (repo.save as jest.Mock).mockResolvedValue({ ...created, id: 1 });

            const result = await service.createUser(dto);

            expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(repo.create).toHaveBeenCalledWith({
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
            });
            expect(repo.save).toHaveBeenCalledWith(created);
            expect(result.role).toBe(Role.Client);
            expect(result.password).toBe('hashedPass');
        });
    });

    describe('findByEmail', () => {
        it('returns an existing user', async () => {
            const user = { id: 1, email: 'known@example.com' } as User;
            (repo.findOne as jest.Mock).mockResolvedValue(user);

            const result = await service.findByEmail('known@example.com');

            expect(result).toEqual(user);
            expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'known@example.com' } });
        });

        it('returns undefined for unknown email', async () => {
            (repo.findOne as jest.Mock).mockResolvedValue(undefined);

            const result = await service.findByEmail('unknown@example.com');

            expect(result).toBeUndefined();
            expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'unknown@example.com' } });
        });
    });
});

