import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const { password: _pw, ...result } = user;
        return result;
    }

    async generateTokens(userId: number, role: Role): Promise<AuthTokensDto> {
        const access = await this.jwtService.signAsync({ sub: userId, role });
        const refresh = randomBytes(32).toString('hex');
        await this.usersService.updateRefreshToken(userId, refresh);
        return { access_token: access, refresh_token: refresh };
    }

    async login(email: string, password: string): Promise<AuthTokensDto> {
        const user = await this.validateUser(email, password);
        return this.generateTokens(user.id, user.role);
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
        return this.generateTokens(user.id, user.role);
    }

    async refresh(refreshToken: string): Promise<AuthTokensDto> {
        const user = await this.usersService.findByRefreshToken(refreshToken);
        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        return this.generateTokens(user.id, user.role);
    }
}
