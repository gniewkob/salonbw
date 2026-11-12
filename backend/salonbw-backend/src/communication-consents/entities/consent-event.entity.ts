import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import {
    CommunicationChannel,
    CommunicationType,
    ConsentEventType,
    ConsentPurpose,
    ConsentSource,
} from '../communication-consent.types';

/**
 * Append-only audit of consent and preference changes. A database trigger
 * rejects UPDATE; rows are only removed together with the customer
 * (ON DELETE CASCADE — erasure / retention), never edited.
 */
@Entity('consent_events')
@Index('IDX_consent_events_customer_time', ['customerId', 'occurredAt'])
export class ConsentEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer?: User;

    @Column({ name: 'actor_id', type: 'int', nullable: true })
    actorId: number | null;

    @Column({ name: 'actor_role', type: 'varchar', length: 20 })
    actorRole: string;

    @Column({ type: 'varchar', length: 40 })
    source: ConsentSource;

    @Column({ type: 'varchar', length: 40, nullable: true })
    purpose: ConsentPurpose | null;

    @Column({
        name: 'communication_type',
        type: 'varchar',
        length: 40,
        nullable: true,
    })
    communicationType: CommunicationType | null;

    @Column({ type: 'varchar', length: 20 })
    channel: CommunicationChannel;

    @Column({ name: 'event_type', type: 'varchar', length: 30 })
    eventType: ConsentEventType;

    @Column({
        name: 'previous_status',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    previousStatus: string | null;

    @Column({ name: 'new_status', type: 'varchar', length: 20 })
    newStatus: string;

    @Column({ name: 'occurred_at', type: 'timestamptz' })
    occurredAt: Date;

    @Column({
        name: 'consent_text_version',
        type: 'varchar',
        length: 80,
        nullable: true,
    })
    consentTextVersion: string | null;

    @Column({
        name: 'evidence_reference',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    evidenceReference: string | null;

    /** Immutable recipient snapshot for WhatsApp consent evidence. */
    @Column({
        name: 'contact_value',
        type: 'varchar',
        length: 32,
        nullable: true,
    })
    contactValue: string | null;

    @Column({ name: 'request_id', type: 'int', nullable: true })
    requestId: number | null;
}
