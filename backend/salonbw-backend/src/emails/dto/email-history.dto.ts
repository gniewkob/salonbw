import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EmailLogStatus } from '../email-log.entity';

export class EmailHistoryFilterDto {
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

    @IsNumber()
    @IsOptional()
    page?: number;

    @IsNumber()
    @IsOptional()
    limit?: number;
}
