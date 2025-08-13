import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, LogAction } from './log.entity';
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
        const log = this.logRepository.create({
            user: user ?? null,
            action,
            description,
        });
        return this.logRepository.save(log);
    }
}
