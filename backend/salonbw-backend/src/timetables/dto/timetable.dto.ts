import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
    IsEnum,
    IsDateString,
    Matches,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/timetable-slot.entity';
import { ExceptionType } from '../entities/timetable-exception.entity';

export class TimetableSlotDto {
    @ApiProperty({ enum: DayOfWeek, description: '0=Monday, 6=Sunday' })
    @IsNumber()
    @Min(0)
    @Max(6)
    dayOfWeek: DayOfWeek;

    @ApiProperty({
        example: '09:00',
        description: 'Start time in HH:mm format',
    })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
    startTime: string;

    @ApiProperty({ example: '17:00', description: 'End time in HH:mm format' })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
    endTime: string;

    @ApiProperty({ required: false, default: false })
    @IsBoolean()
    @IsOptional()
    isBreak?: boolean;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateTimetableDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNumber()
    employeeId: number;

    @ApiProperty({ example: 'Standardowy grafik' })
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '2026-01-01' })
    @IsDateString()
    validFrom: string;

    @ApiProperty({ required: false, example: '2026-12-31' })
    @IsDateString()
    @IsOptional()
    validTo?: string;

    @ApiProperty({ type: [TimetableSlotDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimetableSlotDto)
    slots: TimetableSlotDto[];
}

export class UpdateTimetableDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    validFrom?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    validTo?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ type: [TimetableSlotDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimetableSlotDto)
    @IsOptional()
    slots?: TimetableSlotDto[];
}

export class CreateExceptionDto {
    @ApiProperty({ example: '2026-02-15' })
    @IsDateString()
    date: string;

    @ApiProperty({ enum: ExceptionType })
    @IsEnum(ExceptionType)
    type: ExceptionType;

    @ApiProperty({ required: false, example: 'Urlop wypoczynkowy' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ required: false, example: '10:00' })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'customStartTime must be in HH:mm format',
    })
    @IsOptional()
    customStartTime?: string;

    @ApiProperty({ required: false, example: '14:00' })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'customEndTime must be in HH:mm format',
    })
    @IsOptional()
    customEndTime?: string;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isAllDay?: boolean;
}

export class UpdateExceptionDto {
    @ApiProperty({ required: false, enum: ExceptionType })
    @IsEnum(ExceptionType)
    @IsOptional()
    type?: ExceptionType;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({ required: false })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'customStartTime must be in HH:mm format',
    })
    @IsOptional()
    customStartTime?: string;

    @ApiProperty({ required: false })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'customEndTime must be in HH:mm format',
    })
    @IsOptional()
    customEndTime?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isAllDay?: boolean;
}

export class GetAvailabilityDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNumber()
    @Type(() => Number)
    employeeId: number;

    @ApiProperty({ example: '2026-02-01' })
    @IsDateString()
    from: string;

    @ApiProperty({ example: '2026-02-28' })
    @IsDateString()
    to: string;
}

export class AvailabilitySlot {
    date: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isException: boolean;
    exceptionType?: ExceptionType;
    isAvailable: boolean;
}

export class EmployeeAvailability {
    employeeId: number;
    employeeName: string;
    from: string;
    to: string;
    slots: AvailabilitySlot[];
}
