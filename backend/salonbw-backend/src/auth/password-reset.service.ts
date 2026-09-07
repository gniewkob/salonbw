import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordResetToken } from './password-reset-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { EmailsService } from '../emails/emails.service';
import { User } from '../users/user.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const NEUTRAL_MESSAGE =
    'Jeśli konto istnieje, wysłaliśmy wiadomość z dalszymi instrukcjami.';
const INVALID_TOKEN_MESSAGE =
    'Link jest nieprawidłowy lub wygasł. Poproś o nową wiadomość.';

@Injectable()
export class PasswordResetService {
    constructor(
        private readonly usersService: UsersService,
        @InjectRepository(PasswordResetToken)
        private readonly tokenRepo: Repository<PasswordResetToken>,
        private readonly emailsService: EmailsService,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
        private readonly logService: LogService,
    ) {}

    async requestReset(email: string): Promise<{ message: string }> {
        const startedAt = Date.now();
        const user = await this.usersService.findByEmail(
            email.trim().toLowerCase(),
        );

        if (user) {
            const rawToken = randomBytes(32).toString('base64url');
            const tokenHash = this.hashToken(rawToken);
            const now = new Date();

            await this.tokenRepo.update(
                { userId: user.id, usedAt: IsNull() },
                { usedAt: now },
            );
            await this.tokenRepo.save(
                this.tokenRepo.create({
                    userId: user.id,
                    tokenHash,
                    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
                    usedAt: null,
                }),
            );

            try {
                await this.emailsService.sendPasswordReset(
                    user.email,
                    `${this.getPanelUrl()}/auth/reset-password#token=${encodeURIComponent(rawToken)}`,
                );
            } catch {
                await this.tokenRepo.update(
                    { userId: user.id, tokenHash },
                    { usedAt: new Date() },
                );
                console.error('Failed to send password reset email');
            }
        }

        await this.padResponseTime(startedAt);
        return { message: NEUTRAL_MESSAGE };
    }

    async resetPassword(
        rawToken: string,
        newPassword: string,
    ): Promise<{ message: string }> {
        const tokenHash = this.hashToken(rawToken);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        let userId: number | null = null;

        await this.dataSource.transaction(async (manager) => {
            const resetTokens = manager.getRepository(PasswordResetToken);
            const token = await resetTokens.findOne({
                where: {
                    tokenHash,
                    usedAt: IsNull(),
                    expiresAt: MoreThan(new Date()),
                },
                lock: { mode: 'pessimistic_write' },
            });
            if (!token) {
                throw new BadRequestException(INVALID_TOKEN_MESSAGE);
            }

            userId = token.userId;
            await manager.update(User, token.userId, {
                password: passwordHash,
            });
            await manager.increment(
                User,
                { id: token.userId },
                'authVersion',
                1,
            );
            await resetTokens.update(
                { userId: token.userId, usedAt: IsNull() },
                { usedAt: new Date() },
            );
            await manager
                .getRepository(RefreshToken)
                .update(
                    { userId: token.userId, revokedAt: IsNull() },
                    { revokedAt: new Date() },
                );
        });

        if (userId !== null) {
            try {
                await this.logService.logAction(
                    { id: userId },
                    LogAction.PASSWORD_CHANGED,
                    { userId, source: 'self_service_reset' },
                );
            } catch {
                // Audit failure must not roll back an already completed reset.
            }
        }

        return { message: 'Hasło zostało zmienione. Możesz się zalogować.' };
    }

    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private getPanelUrl(): string {
        const explicit = this.configService.get<string>('PANEL_URL')?.trim();
        if (explicit) return explicit.replace(/\/$/, '');

        const configured = this.configService
            .get<string>('FRONTEND_URL')
            ?.split(',')
            .map((value) => value.trim())
            .find((value) => value.includes('panel.'));
        if (configured) return configured.replace(/\/$/, '');

        return this.configService.get<string>('NODE_ENV') === 'production'
            ? 'https://panel.salon-bw.pl'
            : 'http://localhost:3000';
    }

    private async padResponseTime(startedAt: number): Promise<void> {
        const configured = Number(
            this.configService.get<string>('PASSWORD_RESET_MIN_RESPONSE_MS') ??
                600,
        );
        const minimumMs = Number.isFinite(configured)
            ? Math.max(0, configured)
            : 600;
        const remaining = minimumMs - (Date.now() - startedAt);
        if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
        }
    }
}
