import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

/**
 * Exact proposal displayed to the client. Date and duration must match
 * the row locked by the acceptance transaction; stale tabs get HTTP 409.
 */
export class AcceptRescheduleDto {
    @ApiProperty({
        description: 'Start of the proposal shown to the client (ISO 8601)',
    })
    @IsDateString()
    expectedStartTime: string;

    @ApiProperty({
        description: 'End of the proposal shown to the client (ISO 8601)',
    })
    @IsDateString()
    expectedEndTime: string;
}
