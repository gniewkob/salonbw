import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class GetSummaryQueryDto {
    @ApiProperty({
        description: 'Start date for the summary period',
        example: '2023-01-01T00:00:00Z',
    })
    @IsNotEmpty()
    @IsDateString()
    from: string;

    @ApiProperty({
        description: 'End date for the summary period',
        example: '2023-01-31T23:59:59Z',
    })
    @IsNotEmpty()
    @IsDateString()
    to: string;
}
