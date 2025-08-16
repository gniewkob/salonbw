import { IsDateString } from 'class-validator';

export class GetSummaryDto {
    @IsDateString()
    from: string;

    @IsDateString()
    to: string;
}
