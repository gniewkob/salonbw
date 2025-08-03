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
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        private readonly logs: LogsService,
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
        first: string,
        lastOrRole?: string | Role,
        roleOrPhone?: Role | string,
        phoneOrPrivacy?: string | boolean | null,
        privacyOrMarketing?: boolean,
        marketing?: boolean,
    ) {
        let firstName = first;
        let lastName = '';
        let role: Role = Role.Client;
        let phone: string | null = null;
        let privacyConsent = false;
        let marketingConsent = false;

        if (
            typeof lastOrRole === 'string' &&
            Object.values(Role).includes(lastOrRole as Role) &&
            (roleOrPhone === undefined || typeof roleOrPhone === 'string')
        ) {
            const [fn, ...ln] = first.split(' ');
            firstName = fn;
            lastName = ln.join(' ');
            role = lastOrRole as Role;
            if (typeof roleOrPhone === 'string') {
                phone = roleOrPhone;
            }
        } else {
            lastName = (lastOrRole as string) ?? '';
            role = (roleOrPhone as Role) ?? Role.Client;
            if (typeof phoneOrPrivacy === 'string') {
                phone = phoneOrPrivacy;
                if (typeof privacyOrMarketing === 'boolean') {
                    privacyConsent = privacyOrMarketing;
                }
                if (typeof marketing === 'boolean') {
                    marketingConsent = marketing;
                }
            } else {
                if (typeof phoneOrPrivacy === 'boolean') {
                    privacyConsent = phoneOrPrivacy;
                }
                if (typeof privacyOrMarketing === 'boolean') {
                    marketingConsent = privacyOrMarketing;
                }
            }
        }

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
            privacyConsent,
            marketingConsent,
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

        const profileChanges: Record<string, unknown> = {};
        let profileChanged = false;
        let marketingChanged = false;

        if (dto.email && dto.email !== user.email) {
            const existing = await this.findByEmail(dto.email);
            if (existing && existing.id !== id) {
                throw new BadRequestException('Email already registered');
            }
            user.email = dto.email;
            profileChanges.email = dto.email;
            profileChanged = true;
        }
        if (dto.firstName !== undefined && dto.firstName !== user.firstName) {
            user.firstName = dto.firstName;
            profileChanges.firstName = dto.firstName;
            profileChanged = true;
        }
        if (dto.lastName !== undefined && dto.lastName !== user.lastName) {
            user.lastName = dto.lastName;
            profileChanges.lastName = dto.lastName;
            profileChanged = true;
        }
        if (dto.phone !== undefined && dto.phone !== user.phone) {
            user.phone = dto.phone;
            profileChanges.phone = dto.phone;
            profileChanged = true;
        }
        if (
            dto.marketingConsent !== undefined &&
            dto.marketingConsent !== user.marketingConsent
        ) {
            user.marketingConsent = dto.marketingConsent;
            marketingChanged = true;
        }

        const saved = await this.usersRepository.save(user);

        if (profileChanged) {
            await this.logs.create(
                LogAction.ProfileUpdate,
                JSON.stringify({ id, ...profileChanges }),
                id,
            );
        }
        if (marketingChanged) {
            await this.logs.create(
                LogAction.MarketingConsentChange,
                JSON.stringify({ id, marketingConsent: user.marketingConsent }),
                id,
            );
        }

        return saved;
    }

    async forgetMe(id: number) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException();
        }
        await this.usersRepository.update(id, {
            isActive: false,
            refreshToken: null,
        });
        await this.logs.create(
            LogAction.CustomerDelete,
            JSON.stringify({ id }),
        );
        const anonymizedEmail = `deleted-${id}-${Date.now()}@example.com`;
        await this.usersRepository.update(id, {
            email: anonymizedEmail,
            firstName: '',
            lastName: '',
            phone: null,
            password: null,
            privacyConsent: false,
            marketingConsent: false,
        });
        return this.usersRepository.softDelete(id);
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
        await this.usersRepository.update(id, {
            isActive: false,
            refreshToken: null,
        });
        const result = await this.usersRepository.softDelete(id);
        await this.logs.create(
            LogAction.CustomerDelete,
            JSON.stringify({ id }),
        );
        return result;
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
        await this.usersRepository.update(id, {
            isActive: false,
            refreshToken: null,
        });
        const result = await this.usersRepository.softDelete(id);
        await this.logs.create(
            LogAction.CustomerDelete,
            JSON.stringify({ id }),
        );
        return result;
    }
}
