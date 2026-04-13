import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { randomBytes } from 'crypto';
import { MetricsService } from '../observability/metrics.service';

export interface SocialUser {
    email: string;
    firstName: string;
    lastName: string;
    provider: 'google' | 'facebook' | 'apple';
    providerId: string;
}

@Injectable()
export class SocialAuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly metricsService: MetricsService,
    ) {}

    async validateSocialUser(socialUser: SocialUser): Promise<User> {
        this.metricsService.incSocialLogin(socialUser.provider);
        const { provider, providerId, email } = socialUser;

        // 1. Find by provider ID
        let user = await this.userRepository.findOne({
            where: { [`${provider}Id`]: providerId },
        });

        if (user) {
            return user;
        }

        // 2. Find by email
        user = await this.userRepository.findOne({ where: { email } });

        if (user) {
            // Link existing account
            user[`${provider}Id`] = providerId;
            return this.userRepository.save(user);
        }

        // 3. Create new client
        const newUser = this.userRepository.create({
            email,
            name: `${socialUser.firstName} ${socialUser.lastName}`.trim(),
            firstName: socialUser.firstName,
            lastName: socialUser.lastName,
            role: Role.Customer,
            password: `SOCIAL_AUTH_DISABLED_${randomBytes(16).toString('hex')}`,
            [`${provider}Id`]: providerId,
        });

        return this.userRepository.save(newUser);
    }

    async linkSocialAccount(userId: number, provider: 'google' | 'facebook' | 'apple', providerId: string): Promise<User> {
        const existing = await this.userRepository.findOne({
            where: { [`${provider}Id`]: providerId },
        });

        if (existing && existing.id !== userId) {
            throw new ConflictException(`This ${provider} account is already linked to another user.`);
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        user[`${provider}Id`] = providerId;
        return this.userRepository.save(user);
    }

    generateTokens(user: User) {
        const payload = { sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '1h',
            }),
            refresh_token: this.jwtService.sign(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        };
    }
}
