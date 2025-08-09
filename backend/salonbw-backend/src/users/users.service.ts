import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { email } });
        // Ensure null is returned instead of undefined for unknown emails
        return user ?? null;
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new Error('Email already exists');
        }

        const hashedPassword: string = await (
            bcrypt as unknown as {
                hash(
                    data: string,
                    saltOrRounds: string | number,
                ): Promise<string>;
            }
        ).hash(dto.password, 10);

        const user = this.usersRepository.create({
            email: dto.email,
            name: dto.name,
            password: hashedPassword,
            role: Role.Client,
        });

        return await this.usersRepository.save(user);
    }
}
