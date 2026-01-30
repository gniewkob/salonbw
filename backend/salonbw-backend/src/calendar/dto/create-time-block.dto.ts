import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsOptional,
    IsNumber,
    IsEnum,
    IsString,
    IsBoolean,
} from 'class-validator';
import { TimeBlockType } from '../entities/time-block.entity';

export class CreateTimeBlockDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNumber()
    employeeId: number;

    @ApiProperty({ description: 'Start time (ISO string)' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ description: 'End time (ISO string)' })
    @IsDateString()
    endTime: string;

    @ApiProperty({
        description: 'Type of time block',
        enum: TimeBlockType,
    })
    @IsEnum(TimeBlockType)
    type: TimeBlockType;

    @ApiPropertyOptional({ description: 'Title for the time block' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Is all day event', default: false })
    @IsOptional()
    @IsBoolean()
    allDay?: boolean;
}

export class UpdateTimeBlockDto {
    @ApiPropertyOptional({ description: 'Start time (ISO string)' })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiPropertyOptional({ description: 'End time (ISO string)' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiPropertyOptional({
        description: 'Type of time block',
        enum: TimeBlockType,
    })
    @IsOptional()
    @IsEnum(TimeBlockType)
    type?: TimeBlockType;

    @ApiPropertyOptional({ description: 'Title for the time block' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Is all day event' })
    @IsOptional()
    @IsBoolean()
    allDay?: boolean;
}
