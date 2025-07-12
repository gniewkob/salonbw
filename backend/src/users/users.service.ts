import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    findOne(id: number) {
        return this.usersRepository.findOne({ where: { id } });
    }

    findByEmail(email: string) {
        return this.usersRepository.findOne({ where: { email } });
    }

    async createUser(
        email: string,
        password: string,
        name: string,
        role: Role = Role.Client,
    ) {
        const hashed = await bcrypt.hash(password, 10);
        const user = this.usersRepository.create({
            email,
            password: hashed,
            name,
            role,
        });
        return this.usersRepository.save(user);
    }

    updateRefreshToken(id: number, refreshToken: string | null) {
        return this.usersRepository.update(id, { refreshToken });
    }

    findByRefreshToken(token: string) {
        return this.usersRepository.findOne({ where: { refreshToken: token } });
    }
}
