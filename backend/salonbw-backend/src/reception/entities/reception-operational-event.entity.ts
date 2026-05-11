import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
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

@Entity({ name: 'reception_operational_events' })
export class ReceptionOperationalEvent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 64 })
    eventName!: ReceptionEventName;

    @Column({ type: 'varchar', length: 64 })
    action!: ReceptionAction;

    @Column({ type: 'integer' })
    appointmentId!: number;

    @Column({ type: 'integer', nullable: true })
    customerId!: number | null;

    @Column({ type: 'varchar', length: 16, nullable: true })
    customerAlertSeverity!: ReceptionAlertSeverity | null;

    @Column({ type: 'varchar', length: 64 })
    source!: ReceptionSource;

    @Column({ type: 'timestamp', default: () => 'now()' })
    occurredAt!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

export const RECEPTION_EVENT_NAME_VALUES = RECEPTION_EVENT_NAMES;
export const RECEPTION_ACTION_VALUES = RECEPTION_ACTIONS;
export const RECEPTION_SOURCE_VALUES = RECEPTION_SOURCES;
export const RECEPTION_ALERT_SEVERITY_VALUES = RECEPTION_ALERT_SEVERITIES;
