import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Repository, IsNull } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { Response, CookieOptions } from 'express';
import { JwtSignOptions } from '@nestjs/jwt';
import { LoginAttemptsService } from './login-attempts.service';

@Injectable()
export class AuthService {
    private readonly isDev: boolean;
    private readonly domain: string | undefined;
    private readonly sameSite: CookieOptions['sameSite'];

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly loginAttemptsService: LoginAttemptsService,
        @InjectRepository(RefreshToken)
        private readonly refreshRepo: Repository<RefreshToken>,
    ) {
        this.isDev = configService.get('NODE_ENV') !== 'production';
        this.domain = configService.get('COOKIE_DOMAIN') || undefined;
        if (!this.isDev && !this.domain) {
            throw new Error(
                'COOKIE_DOMAIN environment variable is required in production',
            );
        }
        this.sameSite = 'lax';
    }

    private getCookieOptions(maxAge: number): CookieOptions {
        return {
            httpOnly: true,
            secure: !this.isDev,
            sameSite: this.sameSite,
            domain: this.domain,
            maxAge,
            path: '/',
        };
    }

    private generateCsrfToken() {
        const secret = randomBytes(32).toString('base64url');
        const hash = createHash('sha256').update(secret).digest('hex');
        return { secret, hash };
    }

    private setAuthCookies(
        response: Response,
        accessToken: string,
        refreshToken: string,
        csrfToken: string,
    ): void {
        const accessMaxAge = 60 * 60 * 1000; // 1 hour
        const refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        response.cookie(
            'accessToken',
            accessToken,
            this.getCookieOptions(accessMaxAge),
        );
        response.cookie(
            'refreshToken',
            refreshToken,
            this.getCookieOptions(refreshMaxAge),
        );

        response.cookie('XSRF-TOKEN', csrfToken, {
            ...this.getCookieOptions(accessMaxAge),
            httpOnly: false, // Client needs to read this
        });

        response.cookie('sbw_auth', '1', {
            ...this.getCookieOptions(refreshMaxAge),
            httpOnly: false,
        });
    }

    private clearAuthCookies(response: Response): void {
        const expires = new Date(0);
        response.cookie('accessToken', '', {
            ...this.getCookieOptions(0),
            expires,
        });
        response.cookie('refreshToken', '', {
            ...this.getCookieOptions(0),
            expires,
        });
        response.cookie('XSRF-TOKEN', '', {
            ...this.getCookieOptions(0),
            expires,
            httpOnly: false,
        });
        response.cookie('sbw_auth', '', {
            ...this.getCookieOptions(0),
            expires,
            httpOnly: false,
        });
    }

    async validateUser(
        email: string,
        pass: string,
        ip: string,
        captchaToken?: string,
    ): Promise<Omit<User, 'password'>> {
        // Check if account is locked or requires CAPTCHA
        const isLocked = await this.loginAttemptsService.isAccountLocked(email);
        if (isLocked) {
            throw new UnauthorizedException(
                'Account temporarily locked. Please try again later.',
            );
        }

        const requiresCaptcha =
            await this.loginAttemptsService.isCaptchaRequired(email, ip);
        if (requiresCaptcha && !captchaToken) {
            throw new UnauthorizedException('CAPTCHA required');
        }

        const user = await this.usersService.findByEmail(email);
        const isValidPassword = user
            ? await bcrypt.compare(pass, user.password)
            : false;

        // Record the attempt after password check
        await this.loginAttemptsService.recordAttempt(
            email,
            ip,
            isValidPassword,
        );

        if (!user || !isValidPassword) {
            // Add delay to slow down brute force attempts
            await new Promise((resolve) => setTimeout(resolve, 1000));
            throw new UnauthorizedException('Invalid credentials');
        }

        const { password: _password, ...result } = user;
        void _password;
        return result as Omit<User, 'password'>;
    }

    async login(user: Omit<User, 'password'>, response: Response) {
        const payload = { sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const csrf = this.generateCsrfToken();
        const refreshTokenRecord = await this.createPersistedRefreshToken(
            {
                id: user.id,
                role: user.role,
            },
            csrf.hash,
        );
        const refreshToken = refreshTokenRecord.token;

        this.setAuthCookies(response, accessToken, refreshToken, csrf.secret);

        // For backward compatibility during migration
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    private async createPersistedRefreshToken(
        user: Pick<User, 'id' | 'role'>,
        csrfHash: string,
    ) {
        const jti = randomUUID();
        const expiresIn =
            this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

        const payload: { sub: number; role: string; jti: string } = {
            sub: user.id,
            role: user.role,
            jti,
        };

        const token = this.jwtService.sign(payload, {
            expiresIn:
                typeof expiresIn === 'string' ? parseInt(expiresIn) : expiresIn,
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        } satisfies JwtSignOptions);

        const decoded: unknown = this.jwtService.decode(token);
        const expiresAt = hasExpiration(decoded)
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 7 * 24 * 3600 * 1000);

        const rt = this.refreshRepo.create({
            userId: user.id,
            jti,
            expiresAt,
            meta: { role: user.role, csrfSecretHash: csrfHash },
        });
        await this.refreshRepo.save(rt);

        return { token, jti };
    }

    async refresh(refreshToken: string, response: Response) {
        type RefreshPayload = {
            sub: number;
            role: User['role'];
            jti?: string;
        };

        try {
            const payload = this.jwtService.verify<RefreshPayload>(
                refreshToken,
                {
                    secret: this.configService.get<string>(
                        'JWT_REFRESH_SECRET',
                    ),
                },
            );

            if (!payload.jti) {
                throw new UnauthorizedException(
                    'Invalid refresh token (missing jti)',
                );
            }

            const stored = await this.refreshRepo.findOne({
                where: { jti: payload.jti },
            });
            if (!stored) {
                // possible reuse or token never issued
                throw new UnauthorizedException(
                    'Refresh token revoked or not found',
                );
            }

            if (stored.revokedAt) {
                throw new UnauthorizedException('Refresh token revoked');
            }

            if (stored.expiresAt.getTime() < Date.now()) {
                throw new UnauthorizedException('Refresh token expired');
            }

            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException(
                    'Invalid or expired refresh token',
                );
            }

            // rotate: revoke current jti and issue new one
            stored.revokedAt = new Date();
            await this.refreshRepo.save(stored);

            const csrf = this.generateCsrfToken();
            const newRefresh = await this.createPersistedRefreshToken(
                {
                    id: user.id,
                    role: user.role,
                },
                csrf.hash,
            );
            const accessToken = this.jwtService.sign({
                sub: user.id,
                role: user.role,
            });

            this.setAuthCookies(
                response,
                accessToken,
                newRefresh.token,
                csrf.secret,
            );

            // For backward compatibility during migration
            return {
                access_token: accessToken,
                refresh_token: newRefresh.token,
            };
        } catch {
            // normalize errors
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async revokeRefreshByJti(jti: string) {
        const stored = await this.refreshRepo.findOne({ where: { jti } });
        if (!stored) return false;
        stored.revokedAt = new Date();
        await this.refreshRepo.save(stored);
        return true;
    }

    async revokeAllForUser(userId: number, response?: Response) {
        await this.refreshRepo.update(
            {
                userId,
                revokedAt: IsNull(),
            },
            { revokedAt: new Date() },
        );

        // Also clear cookies if response is provided
        if (response) {
            this.clearAuthCookies(response);
        }
    }
}

type JwtWithExp = { exp: number };

function hasExpiration(value: unknown): value is JwtWithExp {
    return (
        typeof value === 'object' &&
        value !== null &&
        'exp' in value &&
        typeof (value as { exp: unknown }).exp === 'number'
    );
}
