import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {
    CRM_FOLLOW_UP_ACTIONS,
    CRM_FOLLOW_UP_CANDIDATE_REASONS,
    type CrmFollowUpAction as CrmFollowUpActionType,
    type CrmFollowUpCandidateReason,
} from '../reception.constants';

@Entity({ name: 'crm_follow_up_actions' })
export class CrmFollowUpAction {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'integer' })
    customerId!: number;

    @Column({ type: 'integer' })
    appointmentId!: number;

    @Column({ type: 'varchar', length: 64 })
    candidateReason!: CrmFollowUpCandidateReason;

    @Column({ type: 'varchar', length: 32 })
    action!: CrmFollowUpActionType;

    @Column({ type: 'varchar', length: 300, nullable: true })
    note!: string | null;

    @Column({ type: 'timestamp', default: () => 'now()' })
    occurredAt!: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

export const CRM_FOLLOW_UP_ACTION_VALUES = CRM_FOLLOW_UP_ACTIONS;
export const CRM_FOLLOW_UP_REASON_VALUES = CRM_FOLLOW_UP_CANDIDATE_REASONS;
