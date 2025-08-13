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

const bcryptMock = jest.mocked(bcrypt);
const accessSecret = 'access-secret';
const refreshSecret = 'refresh-secret';
const jwtService = {
    sign: jest.fn(
        (payload: string | object | Buffer, options?: { secret?: string }) =>
            jwt.sign(
                payload as jwt.JwtPayload,
                options?.secret ?? accessSecret,
            ),
    ),
    verify: jest.fn(
        (token: string, options?: { secret?: string }) =>
            jwt.verify(
                token,
                options?.secret ?? accessSecret,
            ) as jwt.JwtPayload,
    ),
} as Partial<JwtService> as jest.Mocked<JwtService>;

describe('AuthService.validateUser', () => {
    let service: AuthService;
    let usersService: { findByEmail: jest.Mock; findById: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(() => {
        usersService = { findByEmail: jest.fn(), findById: jest.fn() };
        configService = { get: jest.fn() };
        service = new AuthService(
            usersService as Partial<UsersService> as UsersService,
            jwtService,
            configService as Partial<ConfigService> as ConfigService,
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
        };
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
        };
        usersService.findByEmail.mockResolvedValue(user);
        bcryptMock.compare.mockResolvedValue(false);

        await expect(
            service.validateUser('test@example.com', 'wrong'),
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
            usersService as Partial<UsersService> as UsersService,
            jwtService,
            configService as Partial<ConfigService> as ConfigService,
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
        };

        const { access_token, refresh_token } = service.login(user);

        const accessPayload = jwt.verify(
            access_token,
            accessSecret,
        ) as jwt.JwtPayload;
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
            usersService as Partial<UsersService> as UsersService,
            jwtService,
            configService as Partial<ConfigService> as ConfigService,
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
        };
        usersService.findById.mockResolvedValue(user);

        const refreshToken = service.getRefreshToken(user);
        const { access_token, refresh_token } =
            await service.refresh(refreshToken);

        expect(usersService.findById).toHaveBeenCalledWith(1);

        const accessPayload = jwt.verify(
            access_token,
            accessSecret,
        ) as jwt.JwtPayload;
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
