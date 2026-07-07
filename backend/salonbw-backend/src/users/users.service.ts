import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();
        // Ensure null is returned instead of undefined for unknown emails
        return user ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { id } });
        return user ?? null;
    }

    async findBySocialId(
        field: 'googleId' | 'facebookId',
        id: string,
    ): Promise<User | null> {
        const user = await this.usersRepository.findOne({
            where: { [field]: id },
        });
        return user ?? null;
    }

    async updateSocialId(
        userId: number,
        provider: 'google' | 'facebook',
        socialId: string,
    ): Promise<void> {
        const field = provider === 'google' ? 'googleId' : 'facebookId';
        await this.usersRepository.update(userId, { [field]: socialId });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);
        return await this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findAllByRole(role?: Role): Promise<User[]> {
        if (!role) return this.findAll();
        return this.usersRepository.find({ where: { role } });
    }

    async createUser(dto: CreateUserDto): Promise<User> {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already exists');
        }

        if (!dto.password) {
            throw new BadRequestException('Password is required');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const gdprConsent = dto.gdprConsent ?? false;
        const termsConsent = dto.termsConsent ?? false;
        const user = this.usersRepository.create({
            email: dto.email,
            name: dto.name,
            password: hashedPassword,
            role: Role.Client,
            phone: dto.phone ?? null,
            commissionBase: dto.commissionBase ?? 0,
            receiveNotifications: dto.receiveNotifications ?? true,
            gdprConsent,
            gdprConsentDate: gdprConsent ? new Date() : undefined,
            termsConsent,
            termsConsentDate: termsConsent ? new Date() : undefined,
            smsConsent: dto.smsConsent ?? false,
            whatsappConsent: dto.whatsappConsent ?? dto.smsConsent ?? false,
            emailConsent: dto.emailConsent ?? false,
        });

        return await this.usersRepository.save(user);
    }

    async createUserWithRole(dto: CreateUserDto, role: Role): Promise<User> {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already exists');
        }
        if (!dto.password) {
            throw new BadRequestException('Password is required');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = this.usersRepository.create({
            email: dto.email,
            name: dto.name,
            password: hashedPassword,
            role,
            phone: dto.phone ?? null,
            commissionBase: dto.commissionBase ?? 0,
            receiveNotifications: dto.receiveNotifications ?? true,
        });
        return await this.usersRepository.save(user);
    }

    async updateConsent(
        id: number,
        dto: UpdateConsentDto,
    ): Promise<
        Pick<
            User,
            'notifyPanel' | 'smsConsent' | 'whatsappConsent' | 'emailConsent'
        >
    > {
        const update: Partial<User> = {};
        if (dto.notifyPanel !== undefined) update.notifyPanel = dto.notifyPanel;
        if (dto.smsConsent !== undefined) update.smsConsent = dto.smsConsent;
        if (dto.whatsappConsent !== undefined)
            update.whatsappConsent = dto.whatsappConsent;
        if (dto.emailConsent !== undefined)
            update.emailConsent = dto.emailConsent;
        await this.usersRepository.update(id, update);
        const updated = await this.findById(id);
        return {
            notifyPanel: updated?.notifyPanel ?? true,
            smsConsent: updated?.smsConsent ?? false,
            whatsappConsent: updated?.whatsappConsent ?? false,
            emailConsent: updated?.emailConsent ?? false,
        };
    }

    async updateName(id: number, name: string): Promise<User | null> {
        await this.usersRepository.update(id, { name });
        return this.findById(id);
    }

    async updateProfile(
        id: number,
        dto: UpdateProfileDto,
    ): Promise<User | null> {
        const update: Partial<User> = {};
        if (dto.name !== undefined) update.name = dto.name.trim();
        if (dto.phone !== undefined) update.phone = dto.phone.trim() || null;
        if (Object.keys(update).length > 0) {
            await this.usersRepository.update(id, update);
        }
        return this.findById(id);
    }

    async updateCommissionBase(
        id: number,
        commissionBase: number,
    ): Promise<User | null> {
        await this.usersRepository.update(id, { commissionBase });
        return this.findById(id);
    }

    async updateRole(id: number, role: Role): Promise<User | null> {
        await this.usersRepository.update(id, { role });
        return this.findById(id);
    }

    async changePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: userId })
            .getOne();
        if (!user) throw new BadRequestException('User not found');
        const valid = await bcrypt.compare(
            currentPassword,
            user.password ?? '',
        );
        if (!valid)
            throw new BadRequestException('Nieprawidłowe aktualne hasło');
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.update(userId, { password: hashed });
    }

    async adminResetPassword(
        userId: number,
        newPassword: string,
    ): Promise<void> {
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.update(userId, { password: hashed });
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
