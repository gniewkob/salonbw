import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsString,
    MaxLength,
    IsOptional,
    Min,
} from 'class-validator';

export class AdjustInventoryDto {
    @ApiProperty()
    @IsInt()
    productId!: number;

    @ApiProperty({
        description: 'Positive for stock in, negative for stock out',
    })
    @IsInt()
    @Min(-1000000)
    delta!: number;

    @ApiProperty({ description: 'Reason code, e.g. sale|delivery|correction' })
    @IsString()
    @MaxLength(50)
    reason!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}
