import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

type BcryptMock = {
    compare: jest.Mock;
};

const bcryptMock: BcryptMock = bcrypt as unknown as BcryptMock;
// Extend as needed for future tests (e.g., mock `verify` when necessary)
const jwtService = { sign: jest.fn() } as unknown as JwtService;

describe('AuthService.validateUser', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(() => {
        usersService = { findByEmail: jest.fn() };
        configService = { get: jest.fn() };
        service = new AuthService(
            usersService as unknown as UsersService,
            jwtService,
            configService as unknown as ConfigService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns user without password on valid credentials', async () => {
        const user: User = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed',
            role: Role.Client,
        } as User;
        usersService.findByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(true);

        const result = await service.validateUser(
            'test@example.com',
            'password',
        );

        expect(usersService.findByEmail).toHaveBeenCalledWith(
            'test@example.com',
        );
        expect(bcryptMock.compare).toHaveBeenCalledWith('password', 'hashed');
        expect(result).toEqual({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: Role.Client,
        });
    });

    it('throws UnauthorizedException if user not found', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        await expect(
            service.validateUser('unknown@example.com', 'password'),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on invalid password', async () => {
        const user: User = {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed',
            role: Role.Client,
        } as User;
        usersService.findByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(false);

        await expect(
            service.validateUser('test@example.com', 'wrong'),
        ).rejects.toThrow(UnauthorizedException);
    });
});
