import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Log } from './log.entity';
import { LogAction } from './action.enum';

@Injectable()
export class LogsService {
    constructor(
        @InjectRepository(Log) private readonly repo: Repository<Log>,
    ) {}

    create(
        action: LogAction,
        description?: string,
        userId?: number,
        actorId?: number,
    ) {
        const log = this.repo.create({
            action,
            description: description ?? null,
            user: userId ? ({ id: userId } as any) : null,
            actor: actorId ? ({ id: actorId } as any) : null,
        });
        return this.repo.save(log);
    }

    findAll(filters: {
        startDate?: Date;
        endDate?: Date;
        action?: LogAction;
        userId?: number;
        actorId?: number;
    }) {
        const where: FindOptionsWhere<Log> = {};
        if (filters.action) {
            where.action = filters.action;
        }
        if (filters.userId) {
            where.user = { id: filters.userId } as any;
        }
        if (filters.actorId) {
            where.actor = { id: filters.actorId } as any;
        }
        if (filters.startDate || filters.endDate) {
            where.timestamp = Between(
                filters.startDate ?? new Date(0),
                filters.endDate ?? new Date(),
            );
        }
        return this.repo.find({
            where,
            order: { timestamp: 'DESC' },
            withDeleted: true,
        });
    }
}
