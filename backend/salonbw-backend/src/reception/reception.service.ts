import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReceptionOperationalEventDto } from './dto/create-reception-operational-event.dto';
import { ReceptionOperationalEvent } from './entities/reception-operational-event.entity';

export interface ReceptionOperationalEventResponse {
    id: number;
    eventName: string;
    action: string;
    appointmentId: number;
    customerId: number | null;
    customerAlertSeverity: string | null;
    source: string;
    occurredAt: Date;
    createdAt: Date;
}

@Injectable()
export class ReceptionService {
    constructor(
        @InjectRepository(ReceptionOperationalEvent)
        private readonly receptionEventsRepo: Repository<ReceptionOperationalEvent>,
    ) {}

    async createOperationalEvent(
        dto: CreateReceptionOperationalEventDto,
    ): Promise<ReceptionOperationalEventResponse> {
        const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

        const event = this.receptionEventsRepo.create({
            eventName: dto.eventName,
            action: dto.action,
            appointmentId: dto.appointmentId,
            customerId: dto.customerId ?? null,
            customerAlertSeverity: dto.customerAlertSeverity ?? null,
            source: dto.source,
            occurredAt,
        });

        const saved = await this.receptionEventsRepo.save(event);

        return {
            id: saved.id,
            eventName: saved.eventName,
            action: saved.action,
            appointmentId: saved.appointmentId,
            customerId: saved.customerId ?? null,
            customerAlertSeverity: saved.customerAlertSeverity ?? null,
            source: saved.source,
            occurredAt: saved.occurredAt,
            createdAt: saved.createdAt,
        };
    }
}
