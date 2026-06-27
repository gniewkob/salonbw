import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EmailLogStatus } from '../email-log.entity';

export class EmailHistoryFilterDto {
    // Query params arrive as strings — @Type coerces them to numbers before
    // @IsNumber runs, otherwise page/limit fail validation with a 400.
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    recipientId?: number;

    @IsEnum(EmailLogStatus)
    @IsOptional()
    status?: EmailLogStatus;

    @IsString()
    @IsOptional()
    from?: string;

    @IsString()
    @IsOptional()
    to?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    limit?: number;
}
