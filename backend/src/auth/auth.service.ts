import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';

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

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        const token = await this.jwtService.signAsync({
            sub: user.id,
            role: user.role,
        });
        return { access_token: token };
    }

    async registerClient(dto: RegisterClientDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        return this.usersService.createUser(dto.email, dto.password, dto.name, Role.Client);
    }
}
