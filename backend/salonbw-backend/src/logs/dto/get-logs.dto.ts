import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumber,
    IsOptional,
    IsDateString,
    IsEnum,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction } from '../log-action.enum';

export class GetLogsDto {
    @ApiProperty({ required: false, type: Number })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    userId?: number;

    @ApiProperty({ required: false, enum: LogAction })
    @IsOptional()
    @IsEnum(LogAction)
    action?: LogAction;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({ required: false, default: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;
}
