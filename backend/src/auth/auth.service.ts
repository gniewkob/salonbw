import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

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
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            await this.logs.create(LogAction.LoginFail, `email=${email}`, user.id);
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
            dto.name,
            Role.Client,
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
}
