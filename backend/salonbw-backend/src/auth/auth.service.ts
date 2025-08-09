import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(
        email: string,
        pass: string,
    ): Promise<Omit<User, 'password'>> {
        const user = await this.usersService.findByEmail(email);
        if (!user || !(await bcrypt.compare(pass, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const { password: _password, ...result } = user;
        void _password;
        return result as Omit<User, 'password'>;
    }

    login(user: Omit<User, 'password'>) {
        const payload = { sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: this.getRefreshToken(user),
        };
    }

    getRefreshToken(user: Pick<User, 'id' | 'role'>) {
        const payload = { sub: user.id, role: user.role };
        return this.jwtService.sign(payload, { expiresIn: '7d' });
    }

    refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify<{
                sub: number;
                role: User['role'];
            }>(refreshToken);
            const userPayload: Pick<User, 'id' | 'role'> = {
                id: payload.sub,
                role: payload.role,
            };
            return {
                access_token: this.jwtService.sign({
                    sub: payload.sub,
                    role: payload.role,
                }),
                refresh_token: this.getRefreshToken(userPayload),
            };
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}
