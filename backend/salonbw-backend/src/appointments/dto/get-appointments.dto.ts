import { IsISO8601, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAppointmentsDto {
    @IsOptional()
    @IsISO8601()
    from?: string;

    @IsOptional()
    @IsISO8601()
    to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    employeeId?: number;
}
