import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from './role.enum';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

describe('UsersService', () => {
    let service: UsersService;
    let repo: {
        findOne: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };
    let appointments: { count: jest.Mock };

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        appointments = { count: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repo },
                { provide: getRepositoryToken(Appointment), useValue: appointments },
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

    it('createUser throws BadRequest if email already exists', async () => {
        repo.findOne.mockResolvedValue({ id: 2 } as User);

        await expect(
            service.createUser('a@test.com', 'secret', 'Alice', Role.Client),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('updateCustomer hashes password and saves changes', async () => {
        const user = { id: 1, email: 'old@test.com', password: 'p', name: 'Old' } as User;
        repo.findOne.mockResolvedValue(user);
        repo.save.mockResolvedValue(user);

        await service.updateCustomer(1, { password: 'new', name: 'New' });

        const passed = repo.save.mock.calls[0][0].password;
        expect(await bcrypt.compare('new', passed)).toBe(true);
        expect(repo.save).toHaveBeenCalled();
    });

    it('updateCustomer returns undefined when user missing', async () => {
        repo.findOne.mockResolvedValue(undefined);
        await expect(service.updateCustomer(2, { name: 'x' })).resolves.toBeUndefined();
    });
});
