import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

const ACTIVITY_CATEGORIES = [
    'opinions',
    'calendar',
    'customers',
    'extensions',
    'storage',
    'employees',
    'commissions',
    'services',
    'register',
    'reminders',
    'reservation_notifications',
    'online_reservations',
    'branch',
    'versum',
    'moment',
    'prepayments',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export class GetActivityFeedDto {
    @ApiProperty({ required: false, type: Number })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    userId?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    activity?: string;

    @ApiProperty({ required: false, enum: ACTIVITY_CATEGORIES })
    @IsOptional()
    @IsIn(ACTIVITY_CATEGORIES)
    category?: ActivityCategory;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiProperty({ required: false, default: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 20, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}
