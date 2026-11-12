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
} from '../communication-consent.types';

/**
 * Explicit delivery preference per customer × communication type × channel.
 * Absent row = default (legacy per-channel flag for operational types,
 * "no objection" for marketing types — consent still governs marketing).
 */
@Entity('communication_preferences')
@Index(
    'UQ_communication_preferences_scope',
    ['customerId', 'communicationType', 'channel'],
    { unique: true },
)
export class CommunicationPreference {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'customer_id', type: 'int' })
    customerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer?: User;

    @Column({ name: 'communication_type', type: 'varchar', length: 40 })
    communicationType: CommunicationType;

    @Column({ type: 'varchar', length: 20 })
    channel: CommunicationChannel;

    @Column({ type: 'boolean' })
    enabled: boolean;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @Column({ name: 'updated_by_id', type: 'int', nullable: true })
    updatedById: number | null;

    @Column({ type: 'int', default: 1 })
    version: number;
}
