import { Matches } from 'class-validator';

export class ReceptionFollowUpCandidatesQueryDto {
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    date!: string;
}
