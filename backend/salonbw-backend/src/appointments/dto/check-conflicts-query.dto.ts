import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckConflictsQueryDto {
    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    startTime: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    endTime: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    employeeId?: number;
}
