import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
}));

const bcryptMock = jest.mocked(bcrypt);

describe('UsersService', () => {
    let service: UsersService;
    let repo: jest.Mocked<Repository<User>>;
    let qb: jest.Mocked<
        Pick<SelectQueryBuilder<User>, 'addSelect' | 'where' | 'getOne'>
    >;

    beforeEach(async () => {
        qb = {
            addSelect: jest
                .fn<SelectQueryBuilder<User>, [string]>()
                .mockReturnThis(),
            where: jest
                .fn<
                    SelectQueryBuilder<User>,
                    [string, Record<string, unknown>]
                >()
                .mockReturnThis(),
            getOne: jest.fn<Promise<User | null>, []>(),
        } as unknown as jest.Mocked<
            Pick<SelectQueryBuilder<User>, 'addSelect' | 'where' | 'getOne'>
        >;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        createQueryBuilder: jest
                            .fn<SelectQueryBuilder<User>, [string]>()
                            .mockReturnValue(qb),
                        create: jest.fn<User, [Partial<User>]>(),
                        save: jest.fn<Promise<User>, [User]>(),
                    } as jest.Mocked<Repository<User>>,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repo = module.get<jest.Mocked<Repository<User>>>(
            getRepositoryToken(User),
        );
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
            qb.getOne.mockResolvedValue(null);
            bcryptMock.hash.mockResolvedValue('hashedPass');
            const created = {
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
            };
            const createSpy = jest
                .spyOn(repo, 'create')
                .mockReturnValue(created);
            const saveSpy = jest
                .spyOn(repo, 'save')
                .mockResolvedValue({ ...created, id: 1 });

            const result = await service.createUser(dto);

            expect(bcryptMock.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(createSpy).toHaveBeenCalledWith({
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
            });
            expect(saveSpy).toHaveBeenCalledWith(created);
            expect(result.role).toBe(Role.Client);
            expect(result.password).toBe('hashedPass');
        });
    });

    describe('findByEmail', () => {
        it('returns an existing user', async () => {
            const user = { id: 1, email: 'known@example.com' } as User;
            qb.getOne.mockResolvedValue(user);
            const qbSpy = jest.spyOn(repo, 'createQueryBuilder');

            const result = await service.findByEmail('known@example.com');

            expect(result).toEqual(user);
            expect(qbSpy).toHaveBeenCalledWith('user');
            expect(qb.addSelect).toHaveBeenCalledWith('user.password');
            expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
                email: 'known@example.com',
            });
        });

        it('returns null for unknown email', async () => {
            qb.getOne.mockResolvedValue(null);
            const qbSpy = jest.spyOn(repo, 'createQueryBuilder');

            const result = await service.findByEmail('unknown@example.com');

            expect(result).toBeNull();
            expect(qbSpy).toHaveBeenCalledWith('user');
            expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
                email: 'unknown@example.com',
            });
        });
    });
});
