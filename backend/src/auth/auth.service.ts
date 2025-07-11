import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const token = jwt.sign(
            { sub: user.id, role: user.role },
            process.env.JWT_SECRET ?? 'secret',
            { expiresIn: '1d' },
        );
        const { password: _pw, ...result } = user;
        return { user: result, access_token: token };
    }

    async registerClient(dto: RegisterClientDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        return this.usersService.createUser(dto.email, dto.password, dto.name, Role.Client);
    }
}
