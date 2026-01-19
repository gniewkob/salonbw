import { ApiProperty } from '@nestjs/swagger';

export class GetSummaryDto {
    @ApiProperty({
        description: 'Total commission amount for the period',
        example: 0,
    })
    amount: number;
}
