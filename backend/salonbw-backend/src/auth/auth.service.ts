import { Injectable } from '@nestjs/common';
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
    ): Promise<Omit<User, 'password'> | null> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password: _password, ...result } = user;
            void _password;
            return result as Omit<User, 'password'>;
        }
        return null;
    }

    login(user: Omit<User, 'password'>) {
        const payload = { sub: user.id, role: user.role };
        return { access_token: this.jwtService.sign(payload) };
    }
}
