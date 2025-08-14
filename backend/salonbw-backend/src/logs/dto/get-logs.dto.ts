import { IsEnum, IsInt, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction } from '../log-action.enum';

export class GetLogsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    userId?: number;

    @IsOptional()
    @IsEnum(LogAction)
    action?: LogAction;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit: number = 10;
}
