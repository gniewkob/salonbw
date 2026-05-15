import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import {
    RECEPTION_ACTIONS,
    RECEPTION_ALERT_SEVERITIES,
    RECEPTION_EVENT_NAMES,
    RECEPTION_SOURCES,
    type ReceptionAction,
    type ReceptionAlertSeverity,
    type ReceptionEventName,
    type ReceptionSource,
} from '../reception.constants';

export class CreateReceptionOperationalEventDto {
    @IsIn(RECEPTION_EVENT_NAMES)
    eventName!: ReceptionEventName;

    @IsIn(RECEPTION_ACTIONS)
    action!: ReceptionAction;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    appointmentId!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    customerId?: number;

    @IsOptional()
    @IsIn(RECEPTION_ALERT_SEVERITIES)
    customerAlertSeverity?: ReceptionAlertSeverity;

    @IsIn(RECEPTION_SOURCES)
    source!: ReceptionSource;

    @IsOptional()
    @IsDateString()
    occurredAt?: string;
}
