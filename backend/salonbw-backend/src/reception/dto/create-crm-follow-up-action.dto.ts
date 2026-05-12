import { Type } from 'class-transformer';
import {
    IsDateString,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';
import {
    CRM_FOLLOW_UP_ACTIONS,
    CRM_FOLLOW_UP_CANDIDATE_REASONS,
    type CrmFollowUpAction,
    type CrmFollowUpCandidateReason,
} from '../reception.constants';

export class CreateCrmFollowUpActionDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    customerId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    appointmentId!: number;

    @IsIn(CRM_FOLLOW_UP_CANDIDATE_REASONS)
    candidateReason!: CrmFollowUpCandidateReason;

    @IsIn(CRM_FOLLOW_UP_ACTIONS)
    action!: CrmFollowUpAction;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    note?: string;

    @IsOptional()
    @IsDateString()
    occurredAt?: string;
}
