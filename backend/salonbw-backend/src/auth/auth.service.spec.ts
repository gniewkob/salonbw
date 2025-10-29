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
    decode: jest.fn((token: string) => jwt.decode(token) as jwt.JwtPayload),
} as Partial<JwtService> as jest.Mocked<JwtService>;

describe('AuthService.validateUser', () => {
    let service: AuthService;
    let usersService: jest.Mocked<
        Pick<UsersService, 'findByEmail' | 'findById'>
    >;
    let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
    let loginAttemptsService: any;
    let refreshRepo: any;

    beforeEach(() => {
        usersService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
        } as jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
        configService = { get: jest.fn() } as jest.Mocked<
            Pick<ConfigService, 'get'>
        >;
        loginAttemptsService = {
            isAccountLocked: jest.fn().mockResolvedValue(false),
            isCaptchaRequired: jest.fn().mockResolvedValue(false),
            recordAttempt: jest.fn().mockResolvedValue(null),
        };
        refreshRepo = {
            create: jest.fn().mockImplementation((v) => v),
            save: jest.fn().mockResolvedValue(null),
            findOne: jest.fn().mockResolvedValue(null),
        };
        service = new AuthService(
            usersService as UsersService,
            jwtService,
            configService as ConfigService,
            loginAttemptsService,
            refreshRepo,
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
    let usersService: jest.Mocked<
        Pick<UsersService, 'findByEmail' | 'findById'>
    >;
    let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
    let loginAttemptsService: any;
    let refreshRepo: any;

    beforeEach(() => {
        usersService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
        } as jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
        configService = {
            get: jest.fn().mockReturnValue(refreshSecret),
        } as jest.Mocked<Pick<ConfigService, 'get'>>;
        loginAttemptsService = {
            isAccountLocked: jest.fn().mockResolvedValue(false),
            isCaptchaRequired: jest.fn().mockResolvedValue(false),
            recordAttempt: jest.fn().mockResolvedValue(null),
        };
        refreshRepo = {
            create: jest.fn().mockImplementation((v) => v),
            save: jest.fn().mockResolvedValue(null),
            findOne: jest.fn().mockResolvedValue(null),
        };
        service = new AuthService(
            usersService as UsersService,
            jwtService,
            configService as ConfigService,
            loginAttemptsService,
            refreshRepo,
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
            password: 'hashed',
            role: Role.Client,
        };

        const res = { cookie: jest.fn() } as any;
        return service.login(user, res).then(({ access_token, refresh_token }) => {

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
});

describe('AuthService.refresh', () => {
    let service: AuthService;
    let usersService: jest.Mocked<
        Pick<UsersService, 'findByEmail' | 'findById'>
    >;
    let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
    let loginAttemptsService: any;
    let refreshRepo: any;

    beforeEach(() => {
        usersService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
        } as jest.Mocked<Pick<UsersService, 'findByEmail' | 'findById'>>;
        configService = {
            get: jest.fn().mockReturnValue(refreshSecret),
        } as jest.Mocked<Pick<ConfigService, 'get'>>;
        loginAttemptsService = {
            isAccountLocked: jest.fn().mockResolvedValue(false),
            isCaptchaRequired: jest.fn().mockResolvedValue(false),
            recordAttempt: jest.fn().mockResolvedValue(null),
        };
        refreshRepo = {
            create: jest.fn().mockImplementation((v) => v),
            save: jest.fn().mockResolvedValue(null),
            findOne: jest.fn().mockResolvedValue(null),
        };
        service = new AuthService(
            usersService as UsersService,
            jwtService,
            configService as ConfigService,
            loginAttemptsService,
            refreshRepo,
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

        // craft a valid refresh token signed with the refresh secret and a jti
        const jti = 'test-jti-1';
        const refreshToken = jwt.sign(
            { sub: user.id, role: user.role, jti, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
            refreshSecret,
        );

        // mock stored refresh token record
        refreshRepo.findOne.mockResolvedValue({
            jti,
            userId: user.id,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            revokedAt: null,
            meta: {},
        });

        const res = { cookie: jest.fn() } as any;
        const { access_token, refresh_token } = await service.refresh(refreshToken, res);

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
