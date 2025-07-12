import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';

describe('AuthService', () => {
    let service: AuthService;
    let users: {
        findByEmail: jest.Mock;
        updateRefreshToken: jest.Mock;
        findByRefreshToken: jest.Mock;
    };
    let jwt: { signAsync: jest.Mock };

    beforeEach(async () => {
        users = {
            findByEmail: jest.fn(),
            updateRefreshToken: jest.fn(),
            findByRefreshToken: jest.fn(),
        };
        jwt = { signAsync: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: users },
                { provide: JwtService, useValue: jwt },
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
        jwt.signAsync.mockResolvedValue('token');

        const result = await service.login('b@test.com', 'secret');
        expect(result).toHaveProperty('access_token', 'token');
        expect(result).toHaveProperty('refresh_token');
        expect(users.updateRefreshToken).toHaveBeenCalled();
        expect(jwt.signAsync).toHaveBeenCalledWith({
            sub: 2,
            role: Role.Client,
        });
    });

    it('refresh validates token and returns new tokens', async () => {
        const user = { id: 3, email: 'c@test.com', role: Role.Client };
        users.findByRefreshToken.mockResolvedValue(user);
        jwt.signAsync.mockResolvedValue('newAccess');

        const result = await service.refresh('oldRefresh');
        expect(result).toHaveProperty('access_token', 'newAccess');
        expect(result).toHaveProperty('refresh_token');
        expect(users.updateRefreshToken).toHaveBeenCalledWith(
            user.id,
            expect.any(String),
        );
    });
});
