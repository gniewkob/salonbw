import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';

describe('JwtStrategy session version', () => {
    const config = {
        get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    const users = {
        findAuthStateById: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    it('accepts a token matching the current account version', async () => {
        users.findAuthStateById.mockResolvedValue({
            id: 3,
            role: Role.Client,
            authVersion: 2,
        });
        const strategy = new JwtStrategy(
            config,
            users as unknown as UsersService,
        );

        await expect(
            strategy.validate({ sub: 3, role: Role.Client, authVersion: 2 }),
        ).resolves.toEqual({ userId: 3, id: 3, role: Role.Client });
    });

    it('rejects an access token issued before a password reset', async () => {
        users.findAuthStateById.mockResolvedValue({
            id: 3,
            role: Role.Client,
            authVersion: 2,
        });
        const strategy = new JwtStrategy(
            config,
            users as unknown as UsersService,
        );

        await expect(
            strategy.validate({ sub: 3, role: Role.Client, authVersion: 1 }),
        ).rejects.toThrow(UnauthorizedException);
    });
});
