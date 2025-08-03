import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { SocialLoginDto } from './dto/social-login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly logs: LogsService,
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            await this.logs.create(LogAction.LoginFail, `email=${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }
        if (!user.password) {
            await this.logs.create(LogAction.LoginFail, `email=${email}`);
            throw new UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            await this.logs.create(
                LogAction.LoginFail,
                `email=${email}`,
                user.id,
            );
            throw new UnauthorizedException('Invalid credentials');
        }
        const { password: _pw, ...result } = user;
        return result;
    }

    async generateTokens(
        userId: number,
        role: Role | EmployeeRole,
    ): Promise<AuthTokensDto> {
        const access = await this.jwtService.signAsync({ sub: userId, role });
        const refresh = await this.jwtService.signAsync(
            { sub: userId },
            {
                secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
                expiresIn: '7d',
            },
        );
        await this.usersService.updateRefreshToken(userId, refresh);
        return { access_token: access, refresh_token: refresh };
    }

    async login(email: string, password: string): Promise<AuthTokensDto> {
        const user = await this.validateUser(email, password);
        const tokens = await this.generateTokens(user.id, user.role);
        await this.logs.create(
            LogAction.LoginSuccess,
            `email=${email}`,
            user.id,
        );
        return tokens;
    }

    async registerClient(dto: RegisterClientDto): Promise<AuthTokensDto> {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        const user = await this.usersService.createUser(
            dto.email,
            dto.password,
            dto.firstName,
            dto.lastName,
            Role.Client,
            dto.phone,
            dto.privacyConsent,
            dto.marketingConsent ?? false,
        );
        await this.logs.create(
            LogAction.RegisterSuccess,
            `email=${dto.email}`,
            user.id,
        );
        return this.generateTokens(user.id, user.role);
    }

    async refresh(refreshToken: string): Promise<AuthTokensDto> {
        let payload: { sub: number };
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const user = await this.usersService.findOne(payload.sub);
        if (!user || user.refreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(user.id, user.role);
    }

    async socialLogin(dto: SocialLoginDto): Promise<{
        tokens: AuthTokensDto;
        user: { id: number; email: string; firstName: string; lastName: string; role: Role };
        isNew: boolean;
    }> {
        const { provider, token, marketingConsent } = dto;
        let email: string | undefined;
        let name = '';
        try {
            if (provider === 'google') {
                const res = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
                    params: { id_token: token },
                });
                email = res.data.email as string;
                name = res.data.name as string;
            } else if (provider === 'facebook') {
                const res = await axios.get('https://graph.facebook.com/me', {
                    params: { access_token: token, fields: 'id,name,email' },
                });
                email = res.data.email as string;
                name = res.data.name as string;
            } else if (provider === 'apple') {
                const decoded = jwt.decode(token) as any;
                email = decoded?.email as string | undefined;
                name = decoded?.name as string || '';
            }
        } catch {
            await this.logs.create(LogAction.LoginFail, `${provider} token invalid`);
            throw new UnauthorizedException('Invalid social token');
        }
        if (!email) {
            throw new UnauthorizedException('Email not available');
        }

        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        const existing = await this.usersService.findByEmail(email);
        let user: User;
        let isNew = false;
        if (existing) {
            if (existing.password) {
                throw new BadRequestException('Email already registered');
            }
            if (existing.role !== Role.Client) {
                throw new UnauthorizedException('Invalid account');
            }
            user = existing;
        } else {
            user = await this.usersService.createSocialUser(
                email,
                firstName,
                lastName,
                Role.Client,
                null,
                true,
                marketingConsent ?? false,
            );
            isNew = true;
            await this.logs.create(LogAction.RegisterSuccess, `email=${email}`, user.id);
        }

        const tokens = await this.generateTokens(user.id, user.role);
        await this.logs.create(LogAction.LoginSuccess, `email=${email}`, user.id);
        return {
            tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role as Role,
            },
            isNew,
        };
    }
}
