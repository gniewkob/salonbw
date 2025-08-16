import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class GetSummaryDto {
    @ApiProperty({ required: true, type: String, format: 'date-time' })
    @IsISO8601()
    from: string;

    @ApiProperty({ required: true, type: String, format: 'date-time' })
    @IsISO8601()
    to: string;
}
