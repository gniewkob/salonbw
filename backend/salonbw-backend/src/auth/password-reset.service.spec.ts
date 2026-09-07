import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetToken } from './password-reset-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';
import { LogService } from '../logs/log.service';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

const bcryptMock = jest.mocked(bcrypt);

describe('PasswordResetService', () => {
    const user = { id: 7, email: 'client@example.com' } as User;
    let usersService: { findByEmail: jest.Mock };
    let tokenRepo: {
        update: jest.Mock;
        create: jest.Mock;
        save: jest.Mock;
    };
    let emailsService: { sendPasswordReset: jest.Mock };
    let logService: { logAction: jest.Mock };
    let dataSource: { transaction: jest.Mock };
    let service: PasswordResetService;

    beforeEach(() => {
        usersService = { findByEmail: jest.fn() };
        tokenRepo = {
            update: jest.fn().mockResolvedValue(undefined),
            create: jest.fn((value) => value),
            save: jest.fn().mockResolvedValue(undefined),
        };
        emailsService = {
            sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        };
        logService = { logAction: jest.fn().mockResolvedValue(undefined) };
        dataSource = { transaction: jest.fn() };
        const configService = {
            get: jest.fn((key: string) =>
                key === 'PANEL_URL'
                    ? 'https://panel.example.test'
                    : key === 'PASSWORD_RESET_MIN_RESPONSE_MS'
                      ? '0'
                      : undefined,
            ),
        };

        service = new PasswordResetService(
            usersService as unknown as UsersService,
            tokenRepo as unknown as Repository<PasswordResetToken>,
            emailsService as unknown as EmailsService,
            configService as unknown as ConfigService,
            dataSource as unknown as DataSource,
            logService as unknown as LogService,
        );
    });

    afterEach(() => jest.clearAllMocks());

    it('returns the same neutral response for an unknown address', async () => {
        usersService.findByEmail.mockResolvedValue(null);

        const result = await service.requestReset('missing@example.com');

        expect(result).toEqual({
            message:
                'Jeśli konto istnieje, wysłaliśmy wiadomość z dalszymi instrukcjami.',
        });
        expect(tokenRepo.save).not.toHaveBeenCalled();
        expect(emailsService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('stores only a token hash and sends a 30-minute reset link', async () => {
        usersService.findByEmail.mockResolvedValue(user);

        const result = await service.requestReset(' client@example.com ');

        expect(result.message).toContain('Jeśli konto istnieje');
        expect(usersService.findByEmail).toHaveBeenCalledWith(
            'client@example.com',
        );
        const stored = tokenRepo.create.mock.calls[0][0] as {
            tokenHash: string;
            expiresAt: Date;
        };
        const resetUrl = emailsService.sendPasswordReset.mock
            .calls[0][1] as string;
        const rawToken = new URLSearchParams(
            new URL(resetUrl).hash.slice(1),
        ).get('token');
        expect(rawToken).toBeTruthy();
        expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
        expect(stored.tokenHash).not.toBe(rawToken);
        expect(stored.expiresAt.getTime()).toBeGreaterThan(
            Date.now() + 29 * 60 * 1000,
        );
    });

    it('invalidates the new token when email delivery fails', async () => {
        usersService.findByEmail.mockResolvedValue(user);
        emailsService.sendPasswordReset.mockRejectedValue(
            new Error('delivery failed'),
        );
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);

        await expect(
            service.requestReset('client@example.com'),
        ).resolves.toEqual(
            expect.objectContaining({ message: expect.any(String) }),
        );

        expect(tokenRepo.update).toHaveBeenLastCalledWith(
            expect.objectContaining({
                userId: user.id,
                tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            }),
            { usedAt: expect.any(Date) },
        );
        consoleError.mockRestore();
    });

    it('changes the password atomically and revokes every active session', async () => {
        const resetTokenRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 11,
                userId: user.id,
                usedAt: null,
                expiresAt: new Date(Date.now() + 60_000),
            }),
            update: jest.fn().mockResolvedValue(undefined),
        };
        const refreshRepo = {
            update: jest.fn().mockResolvedValue(undefined),
        };
        const manager = {
            getRepository: jest.fn((entity) =>
                entity === PasswordResetToken ? resetTokenRepo : refreshRepo,
            ),
            update: jest.fn().mockResolvedValue(undefined),
            increment: jest.fn().mockResolvedValue(undefined),
        };
        dataSource.transaction.mockImplementation(
            async (work: (value: typeof manager) => Promise<void>) =>
                work(manager),
        );
        bcryptMock.hash.mockResolvedValue('new-hash' as never);

        await service.resetPassword('raw-token', 'NewPassword8');

        expect(manager.update).toHaveBeenCalledWith(User, user.id, {
            password: 'new-hash',
        });
        expect(manager.increment).toHaveBeenCalledWith(
            User,
            { id: user.id },
            'authVersion',
            1,
        );
        expect(refreshRepo.update).toHaveBeenCalled();
        expect(resetTokenRepo.update).toHaveBeenCalled();
        expect(logService.logAction).toHaveBeenCalled();
    });

    it('rejects an invalid, expired, or already used token', async () => {
        const manager = {
            getRepository: jest.fn(() => ({
                findOne: jest.fn().mockResolvedValue(null),
            })),
        };
        dataSource.transaction.mockImplementation(
            async (work: (value: typeof manager) => Promise<void>) =>
                work(manager),
        );

        await expect(
            service.resetPassword('invalid-token', 'NewPassword8'),
        ).rejects.toThrow(BadRequestException);
    });
});
