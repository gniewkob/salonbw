import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

describe('AuthService', () => {
    let service: AuthService;
    let users: {
        findByEmail: jest.Mock;
        updateRefreshToken: jest.Mock;
        findOne: jest.Mock;
    };
    let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
    let logs: { create: jest.Mock };

    beforeEach(async () => {
        users = {
            findByEmail: jest.fn(),
            updateRefreshToken: jest.fn(),
            findOne: jest.fn(),
        };
        jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
        logs = { create: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: users },
                { provide: JwtService, useValue: jwt },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('validateUser', () => {
        it('returns user without password when credentials valid', async () => {
            const pass = await bcrypt.hash('secret', 10);
            users.findByEmail.mockResolvedValue({
                id: 1,
                email: 'a@test.com',
                password: pass,
                role: Role.Client,
            });

            await expect(
                service.validateUser('a@test.com', 'secret'),
            ).resolves.toEqual(
                expect.objectContaining({
                    id: 1,
                    email: 'a@test.com',
                    role: Role.Client,
                }),
            );
        });

        it('throws Unauthorized when user not found', async () => {
            users.findByEmail.mockResolvedValue(null);
            await expect(
                service.validateUser('a@test.com', 'secret'),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('throws Unauthorized when password mismatch', async () => {
            const pass = await bcrypt.hash('secret', 10);
            users.findByEmail.mockResolvedValue({
                id: 1,
                email: 'a@test.com',
                password: pass,
                role: Role.Client,
            });

            await expect(
                service.validateUser('a@test.com', 'wrong'),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    it('login returns signed tokens and stores refresh token', async () => {
        const pass = await bcrypt.hash('secret', 10);
        users.findByEmail.mockResolvedValue({
            id: 2,
            email: 'b@test.com',
            password: pass,
            role: Role.Client,
        });
        jwt.signAsync
            .mockResolvedValueOnce('access')
            .mockResolvedValueOnce('refresh');

        const result = await service.login('b@test.com', 'secret');
        expect(result).toEqual({
            access_token: 'access',
            refresh_token: 'refresh',
        });
        expect(users.updateRefreshToken).toHaveBeenCalledWith(2, 'refresh');
        expect(jwt.signAsync).toHaveBeenNthCalledWith(1, {
            sub: 2,
            role: Role.Client,
        });
        expect(jwt.signAsync).toHaveBeenNthCalledWith(
            2,
            { sub: 2 },
            expect.objectContaining({ secret: expect.any(String) }),
        );
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.LoginSuccess,
            'email=b@test.com',
            2,
        );
    });

    it('refresh validates token and returns new tokens', async () => {
        const user = {
            id: 3,
            email: 'c@test.com',
            role: Role.Client,
            refreshToken: 'oldRefresh',
        } as any;
        jwt.verifyAsync.mockResolvedValue({ sub: 3 });
        users.findOne.mockResolvedValue(user);
        jwt.signAsync
            .mockResolvedValueOnce('newAccess')
            .mockResolvedValueOnce('newRefresh');

        const result = await service.refresh('oldRefresh');
        expect(result).toEqual({
            access_token: 'newAccess',
            refresh_token: 'newRefresh',
        });
        expect(users.updateRefreshToken).toHaveBeenCalledWith(3, 'newRefresh');
    });
});
