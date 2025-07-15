import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { LogAction } from './action.enum';

@Injectable()
export class LogsService {
    constructor(
        @InjectRepository(Log) private readonly repo: Repository<Log>,
    ) {}

    create(action: LogAction, description?: string, userId?: number) {
        const log = this.repo.create({
            action,
            description: description ?? null,
            user: userId ? ({ id: userId } as any) : null,
        });
        return this.repo.save(log);
    }
}
