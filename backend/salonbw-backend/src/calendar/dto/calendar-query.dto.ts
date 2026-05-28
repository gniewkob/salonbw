import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsOptional,
    IsArray,
    IsNumber,
    IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum CalendarView {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Reception = 'reception',
}

export class CalendarQueryDto {
    @ApiProperty({ description: 'Date to fetch events for (ISO string)' })
    @IsDateString()
    date: string;

    @ApiPropertyOptional({
        description: 'Employee IDs to filter by',
        type: [Number],
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        const entries = Array.isArray(value) ? value : String(value).split(',');

        return entries.map((entry) => {
            if (typeof entry === 'number') return entry;
            const n = parseInt(String(entry).trim(), 10);
            return isNaN(n) ? entry : n; // keep original string so @IsNumber rejects it
        });
    })
    employeeIds?: number[];

    @ApiPropertyOptional({
        description: 'Calendar view type',
        enum: CalendarView,
        default: CalendarView.Day,
    })
    @IsOptional()
    @IsEnum(CalendarView)
    view?: CalendarView = CalendarView.Day;
}

export class TimeBlockQueryDto {
    @ApiProperty({ description: 'Start date (ISO string)' })
    @IsDateString()
    from: string;

    @ApiProperty({ description: 'End date (ISO string)' })
    @IsDateString()
    to: string;

    @ApiPropertyOptional({ description: 'Employee ID to filter by' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    employeeId?: number;
}
