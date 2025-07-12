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

    async login(email: string, password: string): Promise<AuthTokensDto> {
        const user = await this.validateUser(email, password);
        const access = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        const refresh = randomBytes(32).toString('hex');
        await this.usersService.updateRefreshToken(user.id, refresh);
        return { access_token: access, refresh_token: refresh };
    }

    async registerClient(dto: RegisterClientDto): Promise<AuthTokensDto> {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.createUser(
            dto.email,
            hashed,
            dto.name,
            Role.Client,
        );
        const access = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        const refresh = randomBytes(32).toString('hex');
        await this.usersService.updateRefreshToken(user.id, refresh);
        return { access_token: access, refresh_token: refresh };
    }

    async refresh(refreshToken: string): Promise<AuthTokensDto> {
        const user = await this.usersService.findByRefreshToken(refreshToken);
        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const access = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        const newRefresh = randomBytes(32).toString('hex');
        await this.usersService.updateRefreshToken(user.id, newRefresh);
        return { access_token: access, refresh_token: newRefresh };
    }
}
