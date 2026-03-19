import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/timetable-slot.entity';
import { TimetableTemplateDayKind } from '../entities/timetable-template-day.entity';

export class TimetableTemplateDayDto {
    @ApiProperty({ enum: DayOfWeek, description: '0=Monday, 6=Sunday' })
    @Type(() => Number)
    @Min(0)
    @Max(6)
    dayOfWeek: DayOfWeek;

    @ApiProperty({ enum: TimetableTemplateDayKind })
    @IsEnum(TimetableTemplateDayKind)
    kind: TimetableTemplateDayKind;

    @ApiProperty({ required: false, example: '10:00' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'startTime must be in HH:mm format',
    })
    startTime?: string;

    @ApiProperty({ required: false, example: '18:00' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, {
        message: 'endTime must be in HH:mm format',
    })
    endTime?: string;
}

export class CreateTimetableTemplateDto {
    @ApiProperty({ example: 'Nowy szablon' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'color1' })
    @IsString()
    colorClass: string;

    @ApiProperty({ type: [TimetableTemplateDayDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimetableTemplateDayDto)
    days: TimetableTemplateDayDto[];
}

export class UpdateTimetableTemplateDto {
    @ApiProperty({ required: false, example: 'Nowa nazwa szablonu' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false, example: 'color2' })
    @IsOptional()
    @IsString()
    colorClass?: string;

    @ApiProperty({ type: [TimetableTemplateDayDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TimetableTemplateDayDto)
    days?: TimetableTemplateDayDto[];
}
