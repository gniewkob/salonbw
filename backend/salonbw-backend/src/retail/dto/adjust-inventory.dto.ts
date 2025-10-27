import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class AdjustInventoryDto {
    @ApiProperty()
    @IsInt()
    productId!: number;

    @ApiProperty({
        description: 'Positive for stock in, negative for stock out',
    })
    @IsInt()
    delta!: number;

    @ApiProperty({ description: 'Reason code, e.g. sale|delivery|correction' })
    @IsString()
    reason!: string;

    @ApiProperty({ required: false })
    note?: string;
}
