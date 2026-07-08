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
                            .mockReturnValue(
                                qb as unknown as SelectQueryBuilder<User>,
                            ),
                        create: jest.fn<User, [Partial<User>]>(),
                        save: jest.fn<Promise<User>, [User]>(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                    } as unknown as jest.Mocked<Repository<User>>,
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
        it('hashes the password, sets default role and saves user with commissionBase', async () => {
            const dto: CreateUserDto = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'plainPass',
                phone: '+15551234567',
                commissionBase: 10,
                receiveNotifications: true,
            };
            qb.getOne.mockResolvedValue(null);
            (bcryptMock.hash as unknown as jest.Mock).mockResolvedValue(
                'hashedPass',
            );
            const created = {
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
                phone: dto.phone,
                commissionBase: dto.commissionBase,
                receiveNotifications: dto.receiveNotifications,
            };
            const createSpy = jest
                .spyOn(repo, 'create')
                .mockReturnValue(created as unknown as User);
            const saveSpy = jest
                .spyOn(repo, 'save')
                .mockResolvedValue({ ...created, id: 1 } as unknown as User);

            const result = await service.createUser(dto);

            expect(bcryptMock.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(createSpy).toHaveBeenCalledWith({
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
                phone: dto.phone,
                commissionBase: dto.commissionBase,
                receiveNotifications: dto.receiveNotifications,
                gdprConsent: false,
                gdprConsentDate: undefined,
                termsConsent: false,
                termsConsentDate: undefined,
                smsConsent: false,
                whatsappConsent: false,
                emailConsent: false,
            });
            expect(saveSpy).toHaveBeenCalledWith(created);
            expect(result.role).toBe(Role.Client);
            expect(result.password).toBe('hashedPass');
            expect(result.commissionBase).toBe(dto.commissionBase);
            expect(result.phone).toBe(dto.phone);
            expect(result.receiveNotifications).toBe(true);
        });

        it('defaults commissionBase to zero when not provided', async () => {
            const dto: CreateUserDto = {
                email: 'test2@example.com',
                name: 'Test User2',
                password: 'plainPass',
            };
            qb.getOne.mockResolvedValue(null);
            (bcryptMock.hash as unknown as jest.Mock).mockResolvedValue(
                'hashedPass',
            );
            const created = {
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
                phone: null,
                commissionBase: 0,
                receiveNotifications: true,
            };
            const createSpy = jest
                .spyOn(repo, 'create')
                .mockReturnValue(created as unknown as User);
            const saveSpy = jest
                .spyOn(repo, 'save')
                .mockResolvedValue({ ...created, id: 2 } as unknown as User);

            const result = await service.createUser(dto);

            expect(bcryptMock.hash).toHaveBeenCalledWith(dto.password, 10);
            expect(createSpy).toHaveBeenCalledWith({
                email: dto.email,
                name: dto.name,
                password: 'hashedPass',
                role: Role.Client,
                phone: null,
                commissionBase: 0,
                receiveNotifications: true,
                gdprConsent: false,
                gdprConsentDate: undefined,
                termsConsent: false,
                termsConsentDate: undefined,
                smsConsent: false,
                whatsappConsent: false,
                emailConsent: false,
            });
            expect(saveSpy).toHaveBeenCalledWith(created);
            expect(result.commissionBase).toBe(0);
            expect(result.phone).toBeNull();
            expect(result.receiveNotifications).toBe(true);
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

    describe('updateProfile', () => {
        it('updates editable customer profile fields and keeps name in sync', async () => {
            const existing = {
                id: 7,
                email: 'client@example.com',
                name: 'Old Name',
                firstName: 'Old',
                lastName: 'Name',
            } as User;
            const updated = {
                ...existing,
                name: 'Anna Nowak',
                firstName: 'Anna',
                lastName: 'Nowak',
                phone: null,
                city: 'Warszawa',
            } as User;
            repo.findOne
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce(updated);
            repo.update.mockResolvedValue({ affected: 1 } as never);

            const result = await service.updateProfile(7, {
                firstName: ' Anna ',
                lastName: ' Nowak ',
                phone: '   ',
                birthDate: '1990-05-10',
                gender: 'female' as never,
                address: '  Prosta 1 ',
                city: ' Warszawa ',
                postalCode: ' 00-001 ',
            });

            expect(repo.update).toHaveBeenCalledWith(
                7,
                expect.objectContaining({
                    name: 'Anna Nowak',
                    firstName: 'Anna',
                    lastName: 'Nowak',
                    phone: null,
                    gender: 'female',
                    address: 'Prosta 1',
                    city: 'Warszawa',
                    postalCode: '00-001',
                }),
            );
            expect(repo.update.mock.calls[0][1]).toHaveProperty('birthDate');
            expect(result).toBe(updated);
        });
    });
});
