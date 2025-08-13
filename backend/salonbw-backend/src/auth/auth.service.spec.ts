import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
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
const accessSecret = 'access-secret';
const refreshSecret = 'refresh-secret';
const jwtService = {
    sign: jest.fn((payload: unknown, options?: { secret?: string }) =>
        jwt.sign(payload as object, options?.secret ?? accessSecret),
    ),
    verify: jest.fn((token: string, options?: { secret?: string }) =>
        jwt.verify(token, options?.secret ?? accessSecret) as unknown,
    ),
} as unknown as JwtService;

describe('AuthService.validateUser', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(() => {
        usersService = { findByEmail: jest.fn(), findById: jest.fn() };
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

        const { validateUser } = service;
        const result = await validateUser.call(
            service,
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

        const { validateUser } = service;
        await expect(
            validateUser.call(service, 'unknown@example.com', 'password'),
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

        const { validateUser } = service;
        await expect(
            validateUser.call(service, 'test@example.com', 'wrong'),
        ).rejects.toThrow(UnauthorizedException);
    });
});

describe('AuthService.login', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(() => {
        usersService = { findByEmail: jest.fn(), findById: jest.fn() };
        configService = { get: jest.fn().mockReturnValue(refreshSecret) };
        service = new AuthService(
            usersService as unknown as UsersService,
            jwtService,
            configService as unknown as ConfigService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns valid access and refresh tokens', () => {
        const user: User = {
            id: 1,
            email: 'test@example.com',
            name: 'Test',
            role: Role.Client,
        } as User;

        const { login } = service;
        const { access_token, refresh_token } = login.call(service, user);

        const accessPayload = jwt.verify(access_token, accessSecret) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(1);
        expect(accessPayload.role).toBe(Role.Client);

        const refreshPayload = jwt.verify(
            refresh_token,
            refreshSecret,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(1);
        expect(refreshPayload.role).toBe(Role.Client);
    });
});

describe('AuthService.refresh', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(() => {
        usersService = { findByEmail: jest.fn(), findById: jest.fn() };
        configService = { get: jest.fn().mockReturnValue(refreshSecret) };
        service = new AuthService(
            usersService as unknown as UsersService,
            jwtService,
            configService as unknown as ConfigService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns new valid tokens for a valid refresh token', async () => {
        const user: User = {
            id: 1,
            email: 'test@example.com',
            name: 'Test',
            password: 'hashed',
            role: Role.Client,
        } as User;
        usersService.findById.mockResolvedValue(user);

        const { getRefreshToken, refresh } = service;
        const refreshToken = getRefreshToken.call(service, user);
        const { access_token, refresh_token } = await refresh.call(
            service,
            refreshToken,
        );

        expect(usersService.findById).toHaveBeenCalledWith(1);

        const accessPayload = jwt.verify(access_token, accessSecret) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(1);
        expect(accessPayload.role).toBe(Role.Client);

        const refreshPayload = jwt.verify(
            refresh_token,
            refreshSecret,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(1);
        expect(refreshPayload.role).toBe(Role.Client);
    });
});
