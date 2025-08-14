import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Between,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
    FindOptionsWhere,
} from 'typeorm';
import { Log } from './log.entity';
import { LogAction } from './log-action.enum';
import { User } from '../users/user.entity';

@Injectable()
export class LogService {
    constructor(
        @InjectRepository(Log)
        private readonly logRepository: Repository<Log>,
    ) {}

    async logAction(
        user: User | null,
        action: LogAction,
        description?: string | Record<string, any>,
    ): Promise<Log> {
        if (description) {
            const containsSensitiveKey = (
                obj: Record<string, unknown>,
            ): boolean =>
                Object.entries(obj).some(([key, value]) => {
                    if (['password', 'token'].includes(key.toLowerCase())) {
                        return true;
                    }
                    if (typeof value === 'object' && value !== null) {
                        return containsSensitiveKey(
                            value as Record<string, unknown>,
                        );
                    }
                    return false;
                });

            if (typeof description === 'string') {
                const lower = description.toLowerCase();
                if (lower.includes('password') || lower.includes('token')) {
                    throw new Error(
                        'Description contains sensitive information',
                    );
                }
            } else if (
                typeof description === 'object' &&
                description !== null
            ) {
                if (containsSensitiveKey(description)) {
                    throw new Error(
                        'Description contains sensitive information',
                    );
                }
            }
        }

        const log = this.logRepository.create({
            user: user ?? null,
            action,
            description,
        });
        return this.logRepository.save(log);
    }

    async findAll(options: {
        userId?: number;
        action?: LogAction;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ data: Log[]; total: number; page: number; limit: number }> {
        const { userId, action, from, to } = options;
        const page = options.page ?? 1;
        const limit = options.limit ?? 10;

        const where: FindOptionsWhere<Log> = {};

        if (userId) {
            where.user = { id: userId } as User;
        }
        if (action) {
            where.action = action;
        }
        if (from && to) {
            where.timestamp = Between(from, to);
        } else if (from) {
            where.timestamp = MoreThanOrEqual(from);
        } else if (to) {
            where.timestamp = LessThanOrEqual(to);
        }

        const [data, total] = await this.logRepository.findAndCount({
            where,
            order: { timestamp: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }
}
