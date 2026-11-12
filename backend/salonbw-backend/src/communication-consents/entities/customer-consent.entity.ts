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
    ConsentPurpose,
    ConsentSource,
    ConsentStatus,
} from '../communication-consent.types';

/**
 * Current recipient permission per customer × purpose × channel.
 * Includes marketing and operational WhatsApp opt-in (separate purposes).
 * Absence of a row means UNKNOWN, never permission to send.
 * Every row change is accompanied by a consent_events row in the same
 * transaction (see CommunicationConsentsService).
 */
@Entity('customer_consents')
@Index('UQ_customer_consents_scope', ['customerId', 'purpose', 'channel'], {
    unique: true,
})
export class CustomerConsent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer?: User;

    @Column({ type: 'varchar', length: 40 })
    purpose: ConsentPurpose;

    @Column({ type: 'varchar', length: 20 })
    channel: CommunicationChannel;

    @Column({ type: 'varchar', length: 20 })
    status: ConsentStatus.Granted | ConsentStatus.Withdrawn;

    @Column({ type: 'varchar', length: 40 })
    source: ConsentSource;

    @Column({ name: 'actor_id', type: 'int', nullable: true })
    actorId: number | null;

    @Column({ name: 'actor_role', type: 'varchar', length: 20 })
    actorRole: string;

    @Column({ name: 'recorded_at', type: 'timestamptz' })
    recordedAt: Date;

    @Column({ name: 'effective_at', type: 'timestamptz' })
    effectiveAt: Date;

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

    /** Normalized destination when an opt-in is bound to a phone number. */
    @Column({ name: 'contact_value', type: 'varchar', length: 32, nullable: true })
    contactValue: string | null;

    @Column({ type: 'int', default: 1 })
    version: number;
}
