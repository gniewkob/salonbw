import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { PasswordResetService } from '../src/auth/password-reset.service';
import { PasswordResetToken } from '../src/auth/password-reset-token.entity';
import { RefreshToken } from '../src/auth/refresh-token.entity';
import { User } from '../src/users/user.entity';
import { UsersService } from '../src/users/users.service';
import { Role } from '../src/users/role.enum';
import { EmailsService } from '../src/emails/emails.service';
import { LogService } from '../src/logs/log.service';
import { AddPasswordRecovery1762580000000 } from '../src/migrations/1762580000000-AddPasswordRecovery';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres('Password recovery (PostgreSQL)', () => {
    let dataSource: DataSource;
    let usersService: UsersService;
    let passwordResetService: PasswordResetService;
    let resetUrl = '';

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'postgres',
            url: testDatabaseUrl,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        await dataSource.initialize();

        // refresh_tokens predates the migration history but exists in every
        // deployed environment. Recreate that legacy prerequisite explicitly;
        // this test still obtains authVersion and password_reset_tokens only
        // from AddPasswordRecovery1762580000000.
        await dataSource.query(`
            CREATE TABLE IF NOT EXISTS "refresh_tokens" (
                "id" SERIAL PRIMARY KEY,
                "userId" integer NOT NULL,
                "jti" character varying(255) NOT NULL UNIQUE,
                "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revokedAt" TIMESTAMP WITH TIME ZONE,
                "meta" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);

        usersService = new UsersService(dataSource.getRepository(User));
        const emails = {
            sendPasswordReset: jest.fn(
                async (_to: string, url: string) => void (resetUrl = url),
            ),
        } as unknown as EmailsService;
        const config = {
            get: jest.fn((key: string) =>
                key === 'PANEL_URL'
                    ? 'https://panel.example.test'
                    : key === 'PASSWORD_RESET_MIN_RESPONSE_MS'
                      ? '0'
                      : undefined,
            ),
        } as unknown as ConfigService;
        const logs = {
            logAction: jest.fn().mockResolvedValue(undefined),
        } as unknown as LogService;
        passwordResetService = new PasswordResetService(
            usersService,
            dataSource.getRepository(PasswordResetToken),
            emails,
            config,
            dataSource,
            logs,
        );
        // Dropping the schema and replaying every migration takes well over
        // the default hook budget on a loaded CI runner.
    }, 120_000);

    afterAll(async () => {
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('can roll the password recovery migration down and up', async () => {
        const migration = new AddPasswordRecovery1762580000000();
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            await migration.down(queryRunner);
            expect(await queryRunner.hasTable('password_reset_tokens')).toBe(
                false,
            );
            expect(await queryRunner.hasColumn('users', 'authVersion')).toBe(
                false,
            );

            await migration.up(queryRunner);
            expect(await queryRunner.hasTable('password_reset_tokens')).toBe(
                true,
            );
            expect(await queryRunner.hasColumn('users', 'authVersion')).toBe(
                true,
            );
        } finally {
            await queryRunner.release();
        }
    });

    it('migrates the schema and completes a single-use atomic reset', async () => {
        const users = dataSource.getRepository(User);
        const refreshTokens = dataSource.getRepository(RefreshToken);
        const passwordHash = await bcrypt.hash('OldPassword8', 10);
        const user = await users.save({
            email: 'password-reset@example.invalid',
            password: passwordHash,
            name: 'Password reset fixture',
            role: Role.Client,
            phone: null,
            receiveNotifications: true,
            commissionBase: 0,
        });
        await refreshTokens.save({
            userId: user.id,
            jti: 'password-reset-test-session',
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null,
        });

        await passwordResetService.requestReset(user.email);
        const rawToken = new URLSearchParams(
            new URL(resetUrl).hash.slice(1),
        ).get('token');
        expect(rawToken).toBeTruthy();

        const attempts = await Promise.allSettled([
            passwordResetService.resetPassword(
                rawToken as string,
                'NewPassword8',
            ),
            passwordResetService.resetPassword(
                rawToken as string,
                'OtherPassword8',
            ),
        ]);
        expect(
            attempts.filter((result) => result.status === 'fulfilled'),
        ).toHaveLength(1);
        const rejected = attempts.find(
            (result) => result.status === 'rejected',
        ) as PromiseRejectedResult;
        expect(rejected.reason).toBeInstanceOf(BadRequestException);

        const account = await users
            .createQueryBuilder('user')
            .addSelect('user.password')
            .addSelect('user.authVersion')
            .where('user.id = :id', { id: user.id })
            .getOneOrFail();
        expect(account.authVersion).toBe(1);
        expect(
            (await bcrypt.compare('NewPassword8', account.password)) ||
                (await bcrypt.compare('OtherPassword8', account.password)),
        ).toBe(true);

        const storedReset = await dataSource
            .getRepository(PasswordResetToken)
            .findOneByOrFail({ userId: user.id });
        expect(storedReset.usedAt).toBeInstanceOf(Date);
        expect(storedReset.tokenHash).not.toBe(rawToken);
        expect(
            (await refreshTokens.findOneByOrFail({ userId: user.id }))
                .revokedAt,
        ).toBeInstanceOf(Date);
    });
});
