import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LoginAttempt } from './login-attempt.entity';

@Injectable()
export class LoginAttemptsService {
    constructor(
        @InjectRepository(LoginAttempt)
        private readonly loginAttemptRepo: Repository<LoginAttempt>,
    ) {}

    async recordAttempt(email: string, ipAddress: string, successful: boolean) {
        const attempt = this.loginAttemptRepo.create({
            email,
            ipAddress,
            successful,
        });
        await this.loginAttemptRepo.save(attempt);
    }

    async isAccountLocked(email: string): Promise<boolean> {
        const recentFailedAttempts = await this.loginAttemptRepo.count({
            where: {
                email,
                successful: false,
                createdAt: MoreThan(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes
            },
        });
        return recentFailedAttempts >= 5; // Lock after 5 failed attempts
    }

    async isCaptchaRequired(
        email: string,
        ipAddress: string,
    ): Promise<boolean> {
        const timeWindow = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

        const [recentEmailAttempts, recentIpAttempts] = await Promise.all([
            this.loginAttemptRepo.count({
                where: {
                    email,
                    successful: false,
                    createdAt: MoreThan(timeWindow),
                },
            }),
            this.loginAttemptRepo.count({
                where: {
                    ipAddress,
                    successful: false,
                    createdAt: MoreThan(timeWindow),
                },
            }),
        ]);

        return recentEmailAttempts >= 3 || recentIpAttempts >= 5;
    }

    async cleanupOldAttempts() {
        // Keep only last 24 hours of attempts
        await this.loginAttemptRepo.delete({
            createdAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        });
    }
}
