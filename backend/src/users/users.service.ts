import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
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
        firstName: string,
        lastName: string,
        role: Role = Role.Client,
        phone?: string | null,
        privacyConsent?: boolean,
        marketingConsent?: boolean,
    ) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = this.usersRepository.create({
            email,
            password: hashed,
            firstName,
            lastName,
            role,
            phone: phone ?? null,
            privacyConsent: privacyConsent ?? false,
            marketingConsent: marketingConsent ?? false,
        });
        return this.usersRepository.save(user);
    }

    async createSocialUser(
        email: string,
        firstName: string,
        lastName: string,
        role: Role = Role.Client,
        phone?: string | null,
        privacyConsent = true,
        marketingConsent = false,
    ) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        const user = this.usersRepository.create({
            email,
            password: null,
            firstName,
            lastName,
            role,
            phone: phone ?? null,
            privacyConsent,
            marketingConsent,
        });
        return this.usersRepository.save(user);
    }

    updateRefreshToken(id: number, refreshToken: string | null) {
        return this.usersRepository.update(id, { refreshToken });
    }

    findByRefreshToken(token: string) {
        return this.usersRepository.findOne({ where: { refreshToken: token } });
    }

    async updateCustomer(id: number, dto: UpdateCustomerDto) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            return undefined;
        }
        if (dto.email && dto.email !== user.email) {
            const existing = await this.findByEmail(dto.email);
            if (existing && existing.id !== id) {
                throw new BadRequestException('Email already registered');
            }
            user.email = dto.email;
        }
        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }
        if (dto.firstName !== undefined) {
            user.firstName = dto.firstName;
        }
        if (dto.lastName !== undefined) {
            user.lastName = dto.lastName;
        }
        if (dto.phone !== undefined) {
            user.phone = dto.phone;
        }
        if (dto.privacyConsent !== undefined) {
            user.privacyConsent = dto.privacyConsent;
        }
        if (dto.marketingConsent !== undefined) {
            user.marketingConsent = dto.marketingConsent;
        }
        return this.usersRepository.save(user);
    }

    async removeCustomer(id: number, adminId: number) {
        if (id === adminId) {
            throw new BadRequestException('Cannot delete your own account');
        }
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException();
        }
        const count = await this.appointments.count({
            where: { client: { id } },
        });
        if (count > 0) {
            throw new BadRequestException(
                'Cannot delete user with appointments',
            );
        }
        return this.usersRepository.delete(id);
    }

    async removeEmployee(id: number, adminId: number) {
        if (id === adminId) {
            throw new BadRequestException('Cannot delete your own account');
        }
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException();
        }
        const count = await this.appointments.count({
            where: { employee: { id } },
        });
        if (count > 0) {
            throw new BadRequestException(
                'Cannot delete user with appointments',
            );
        }
        return this.usersRepository.delete(id);
    }
}
