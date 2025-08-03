import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from './role.enum';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';

describe('UsersService', () => {
    let service: UsersService;
    let repo: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };
    let appointments: { count: jest.Mock };
    let logs: { create: jest.Mock };

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        appointments = { count: jest.fn() };
        logs = { create: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
                {
                    provide: getRepositoryToken(Appointment),
                    useValue: appointments,
                },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('findByEmail resolves a user object for a provided email', async () => {
        const user = { id: 1, email: 'a@test.com' } as User;
        repo.findOne.mockResolvedValue(user);

        await expect(service.findByEmail('a@test.com')).resolves.toEqual(user);
        expect(repo.findOne).toHaveBeenCalledWith({
            where: { email: 'a@test.com' },
        });
    });

    it('createUser hashes the password before calling save', async () => {
        const plain = 'secret';
        const created = {
            email: 'a@test.com',
            password: 'hashed',
            firstName: 'A',
            lastName: 'Test',
            role: Role.Client,
        } as User;
        repo.create.mockReturnValue(created);
        repo.save.mockResolvedValue(created);

        await service.createUser(
            'a@test.com',
            plain,
            'A',
            'Test',
            Role.Client,
        );

        const passed: string = repo.create.mock.calls[0][0].password as string;
        expect(await bcrypt.compare(plain, passed)).toBe(true);
        expect(repo.save).toHaveBeenCalledWith(created);
    });

    it('createUser throws BadRequest if email already exists', async () => {
        repo.findOne.mockResolvedValue({ id: 2 } as User);

        await expect(
            service.createUser(
                'a@test.com',
                'secret',
                'Alice',
                'Smith',
                Role.Client,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('updateCustomer saves changes to allowed fields', async () => {
        const user = {
            id: 1,
            email: 'old@test.com',
            firstName: 'Old',
            lastName: 'Name',
            marketingConsent: false,
        } as User;
        repo.findOne.mockResolvedValue(user);
        repo.save.mockResolvedValue(user);

        await service.updateCustomer(1, {
            firstName: 'New',
            marketingConsent: true,
        });

        const saved = repo.save.mock.calls[0][0] as User;
        expect(saved.firstName).toBe('New');
        expect(saved.marketingConsent).toBe(true);
        expect(repo.save).toHaveBeenCalled();
    });

    it('updateCustomer throws BadRequest if email already registered', async () => {
        const user = {
            id: 1,
            email: 'old@test.com',
        } as User;
        repo.findOne
            .mockResolvedValueOnce(user) // find user by id
            .mockResolvedValueOnce({ id: 2 } as User); // find existing email

        await expect(
            service.updateCustomer(1, { email: 'new@test.com' }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('updateCustomer returns undefined when user missing', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(
            service.updateCustomer(2, { firstName: 'x' }),
        ).resolves.toBeUndefined();
    });
});
