import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { randomBytes } from 'crypto';

interface SocialProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
}

@Injectable()
export class SocialAuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
    ) {}

    async handleSocialLogin(
        req: Request,
        res: Response,
        provider: 'google' | 'facebook',
        redirect?: string,
    ): Promise<{ redirectUrl: string }> {
        const profile = req.user as SocialProfile;
        if (!profile?.email) {
            throw new UnauthorizedException(
                'No email provided from social provider',
            );
        }

        // Find existing user by social ID
        let user = await this.findUserBySocialId(provider, profile.id);

        if (!user) {
            // Check if user exists with same email
            const existingUser = await this.usersService.findByEmail(
                profile.email,
            );

            if (existingUser) {
                // Link social account to existing user
                await this.linkSocialAccount(
                    existingUser.id,
                    provider,
                    profile.id,
                );
                user = await this.usersService.findById(existingUser.id);
            } else {
                // Create new user
                user = await this.createSocialUser({
                    email: profile.email,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    picture: profile.picture,
                    provider,
                    socialId: profile.id,
                });
            }
        }

        if (!user) {
            throw new UnauthorizedException('Failed to create or find user');
        }

        // Generate tokens and set cookies
        await this.authService.login(user, res);

        return { redirectUrl: redirect || '/dashboard' };
    }

    async getLinkedSocialAccounts(
        userId: number,
    ): Promise<{ google: boolean; facebook: boolean }> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            google: !!user.googleId,
            facebook: !!user.facebookId,
        };
    }

    private async findUserBySocialId(
        provider: 'google' | 'facebook',
        socialId: string,
    ): Promise<User | null> {
        // This would need a custom method in UsersService
        // For now, we'll implement a basic version
        const field = provider === 'google' ? 'googleId' : 'facebookId';
        return this.usersService.findBySocialId(field, socialId);
    }

    private async linkSocialAccount(
        userId: number,
        provider: 'google' | 'facebook',
        socialId: string,
    ): Promise<void> {
        await this.usersService.updateSocialId(userId, provider, socialId);
    }

    private async createSocialUser(data: {
        email: string;
        firstName?: string;
        lastName?: string;
        picture?: string;
        provider: 'google' | 'facebook';
        socialId: string;
    }): Promise<User> {
        const userData = {
            email: data.email,
            name:
                `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
                data.email.split('@')[0],
            firstName: data.firstName,
            lastName: data.lastName,
            role: Role.Client,
            password: this.generateRandomPassword(),
            ...(data.provider === 'google'
                ? { googleId: data.socialId }
                : { facebookId: data.socialId }),
        };

        return this.usersService.create(userData);
    }

    private generateRandomPassword(): string {
        // Generate a secure random password
        return randomBytes(32).toString('hex');
    }
}
