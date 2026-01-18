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
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    userId?: number;

    @ApiProperty({ enum: LogAction, required: false })
    @IsOptional()
    @IsEnum(LogAction)
    action?: LogAction;

    @ApiProperty({ required: false, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({ required: false, format: 'date-time' })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    limit?: number = 10;
}
