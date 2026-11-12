import {
    Optional,
    BadRequestException,
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Role } from './role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { CommunicationConsentsService } from '../communication-consents/communication-consents.service';
import { REGISTRATION_DIRECT_MARKETING_TEXT_VERSION } from '../communication-consents/communication-consent.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

export const EMAIL_TAKEN_SELF_SIGNUP =
    'Konto z tym adresem e-mail już istnieje. Jeśli to Twój adres, ustaw hasło przez „Nie pamiętasz hasła?”.';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @Optional() private readonly logService?: LogService,
        @Optional()
        private readonly consents?: CommunicationConsentsService,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .addSelect('user.authVersion')
            .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
            .getOne();
        // Ensure null is returned instead of undefined for unknown emails
        return user ?? null;
    }

    async findById(id: number): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { id } });
        return user ?? null;
    }

    async findAuthStateById(
        id: number,
    ): Promise<Pick<User, 'id' | 'role' | 'authVersion'> | null> {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .select(['user.id', 'user.role'])
            .addSelect('user.authVersion')
            .where('user.id = :id', { id })
            .getOne();
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

    async updateSocialProfile(
        userId: number,
        provider: 'google' | 'facebook',
        profile: {
            socialId: string;
            firstName?: string;
            lastName?: string;
            picture?: string;
        },
    ): Promise<void> {
        const existing = await this.findById(userId);
        const field = provider === 'google' ? 'googleId' : 'facebookId';
        const fullName = [profile.firstName, profile.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
        const update: Record<string, unknown> = {
            [field]: profile.socialId,
        };

        if (!existing?.firstName && profile.firstName) {
            update.firstName = profile.firstName.trim();
        }
        if (!existing?.lastName && profile.lastName) {
            update.lastName = profile.lastName.trim();
        }
        if (fullName && (!existing?.name || existing.name === existing.email)) {
            update.name = fullName;
        }
        if (!existing?.avatarUrl && profile.picture) {
            update.avatarUrl = profile.picture.trim();
        }

        await this.usersRepository.update(userId, update);
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
            // Every client the salon already knows (phone bookings, the
            // historical import) has an account without a password she knows.
            // Signing up is where she lands first, so point her at recovery.
            throw new BadRequestException(EMAIL_TAKEN_SELF_SIGNUP);
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
            notifySms: false,
            notifyWhatsapp: false,
            notifyEmail: true,
            // Marketing consents are recorded below as audited GRANTED events
            // (source REGISTRATION); the legacy columns follow from that.
            smsConsent: false,
            whatsappConsent: false,
            emailConsent: false,
        });

        // The new single registration choice takes precedence over old
        // per-channel checkboxes. Channel-specific records stay independent
        // for later restriction / withdrawal and send-time eligibility.
        const marketing = {
            smsConsent: dto.marketingConsent ?? dto.smsConsent ?? false,
            whatsappConsent: dto.marketingConsent ?? dto.whatsappConsent ?? false,
            emailConsent: dto.marketingConsent ?? dto.emailConsent ?? false,
        };
        const anyMarketing = Object.values(marketing).some(Boolean);
        // Never manufacture marketing permission from legacy booleans when
        // the append-only evidence service is unavailable. Registration with
        // no marketing choice remains valid without consent infrastructure.
        if (anyMarketing && !this.consents) {
            throw new ServiceUnavailableException(
                'Nie można teraz zarejestrować zgody marketingowej. Spróbuj ponownie później.',
            );
        }
        if (!anyMarketing) {
            return await this.usersRepository.save(user);
        }
        return this.usersRepository.manager.transaction(async (manager) => {
            const saved = await manager.save(User, user);
            await this.consents!.applyLegacyFlags(
                manager,
                saved.id,
                marketing,
                { id: saved.id, role: Role.Client },
                'registration',
                dto.marketingConsent === true
                    ? REGISTRATION_DIRECT_MARKETING_TEXT_VERSION
                    : undefined,
            );
            Object.assign(saved, marketing);
            return saved;
        });
    }

    async createUserWithRole(dto: CreateUserDto, role: Role): Promise<User> {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException(
                'Konto z tym adresem e-mail już istnieje.',
            );
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
            notifySms: false,
            notifyWhatsapp: false,
            notifyEmail: true,
        });
        return await this.usersRepository.save(user);
    }

    async updateConsent(
        id: number,
        dto: UpdateConsentDto,
    ): Promise<
        Pick<
            User,
            | 'receiveNotifications'
            | 'notifyPanel'
            | 'notifySms'
            | 'notifyWhatsapp'
            | 'notifyEmail'
            | 'smsConsent'
            | 'whatsappConsent'
            | 'emailConsent'
        >
    > {
        const before = await this.findById(id);
        const update: Partial<User> = {};
        if (dto.receiveNotifications !== undefined)
            update.receiveNotifications = dto.receiveNotifications;
        const communicationFlags = {
            notifyPanel: dto.notifyPanel,
            notifySms: dto.notifySms,
            notifyWhatsapp: dto.notifyWhatsapp,
            notifyEmail: dto.notifyEmail,
            smsConsent: dto.smsConsent,
            whatsappConsent: dto.whatsappConsent,
            emailConsent: dto.emailConsent,
        };
        if (before?.role === Role.Client && this.consents) {
            // Clients: route through the audited consent service so the old
            // account form produces consent_events in one transaction.
            const flags = Object.fromEntries(
                Object.entries(communicationFlags).filter(
                    ([, value]) => value !== undefined,
                ),
            ) as Record<string, boolean>;
            await this.usersRepository.manager.transaction(async (manager) => {
                if (Object.keys(update).length) {
                    await manager.update(User, id, update);
                }
                if (Object.keys(flags).length) {
                    await this.consents!.applyLegacyFlags(
                        manager,
                        id,
                        flags,
                        { id, role: Role.Client },
                        'legacy-self',
                    );
                }
            });
            const updated = await this.findById(id);
            return {
                receiveNotifications: updated?.receiveNotifications ?? true,
                notifyPanel: updated?.notifyPanel ?? true,
                notifySms: updated?.notifySms ?? false,
                notifyWhatsapp: updated?.notifyWhatsapp ?? false,
                notifyEmail: updated?.notifyEmail ?? true,
                smsConsent: updated?.smsConsent ?? false,
                whatsappConsent: updated?.whatsappConsent ?? false,
                emailConsent: updated?.emailConsent ?? false,
            };
        }
        for (const [key, value] of Object.entries(communicationFlags)) {
            if (value !== undefined) {
                (update as Record<string, boolean>)[key] = value;
            }
        }
        await this.usersRepository.update(id, update);
        const updated = await this.findById(id);
        // Audit-trail RODO: zapis zmiany zgód (stare→nowe wartości) w logach —
        // revoke nie zostawia już zmiany bez śladu. Non-fatal: błąd logowania
        // nie może zablokować zapisu zgody.
        if (before && updated) {
            const changes: Record<string, { from: boolean; to: boolean }> = {};
            (
                [
                    'receiveNotifications',
                    'notifyPanel',
                    'notifySms',
                    'notifyWhatsapp',
                    'notifyEmail',
                    'smsConsent',
                    'whatsappConsent',
                    'emailConsent',
                ] as const
            ).forEach((field) => {
                const from = Boolean(before[field]);
                const to = Boolean(updated[field]);
                if (from !== to) changes[field] = { from, to };
            });
            if (Object.keys(changes).length > 0) {
                try {
                    await this.logService?.logAction(
                        updated,
                        LogAction.CONSENT_UPDATED,
                        { userId: id, changes },
                    );
                } catch {
                    // audyt nie może blokować zmiany zgody
                }
            }
        }
        return {
            receiveNotifications: updated?.receiveNotifications ?? true,
            notifyPanel: updated?.notifyPanel ?? true,
            notifySms: updated?.notifySms ?? false,
            notifyWhatsapp: updated?.notifyWhatsapp ?? false,
            notifyEmail: updated?.notifyEmail ?? true,
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
        const current = await this.findById(id);
        if (!current) return null;

        const update: Record<string, unknown> = {};
        const clean = (value?: string | null) => {
            if (value === undefined) return undefined;
            const trimmed = value?.trim() ?? '';
            return trimmed || null;
        };

        const firstName = clean(dto.firstName);
        const lastName = clean(dto.lastName);

        if (dto.name !== undefined) update.name = dto.name.trim();
        if (dto.phone !== undefined) update.phone = clean(dto.phone);
        if (dto.firstName !== undefined) update.firstName = firstName;
        if (dto.lastName !== undefined) update.lastName = lastName;
        if (dto.birthDate !== undefined)
            update.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
        if (dto.gender !== undefined) update.gender = dto.gender || null;
        if (dto.address !== undefined) update.address = clean(dto.address);
        if (dto.city !== undefined) update.city = clean(dto.city);
        if (dto.postalCode !== undefined)
            update.postalCode = clean(dto.postalCode);

        if (dto.firstName !== undefined || dto.lastName !== undefined) {
            const composedName = [
                firstName ?? current.firstName,
                lastName ?? current.lastName,
            ]
                .filter(Boolean)
                .join(' ')
                .trim();
            if (composedName) update.name = composedName;
        }

        if (Object.keys(update).length > 0) {
            await this.usersRepository.update(id, update);
        }
        return this.findById(id);
    }

    async updateAvatarUrl(
        id: number,
        avatarUrl: string | null,
    ): Promise<User | null> {
        await this.usersRepository.update(id, { avatarUrl });
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
