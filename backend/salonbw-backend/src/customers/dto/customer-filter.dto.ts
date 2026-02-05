import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsEnum,
    IsDateString,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export class CustomerFilterDto {
    @ApiPropertyOptional({ description: 'Search by name or phone' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: Gender })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiPropertyOptional({ description: 'Minimum age' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(150)
    @Type(() => Number)
    ageMin?: number;

    @ApiPropertyOptional({ description: 'Maximum age' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(150)
    @Type(() => Number)
    ageMax?: number;

    @ApiPropertyOptional({ description: 'Filter by group ID' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    groupId?: number;

    @ApiPropertyOptional({ description: 'Filter by tag ID' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    tagId?: number;

    @ApiPropertyOptional({ description: 'Minimum total spent' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    spentMin?: number;

    @ApiPropertyOptional({ description: 'Maximum total spent' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    spentMax?: number;

    @ApiPropertyOptional({ description: 'Had visit since date (ISO)' })
    @IsOptional()
    @IsDateString()
    hasVisitSince?: string;

    @ApiPropertyOptional({ description: 'No visit since date (ISO)' })
    @IsOptional()
    @IsDateString()
    noVisitSince?: string;

    @ApiPropertyOptional({ description: 'Filter by service ID (customers who used this service)' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    serviceId?: number;

    @ApiPropertyOptional({ description: 'Filter by employee ID (customers served by this employee)' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    employeeId?: number;

    @ApiPropertyOptional({ description: 'Has upcoming scheduled visit' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    hasUpcomingVisit?: boolean;

    @ApiPropertyOptional({ description: 'Has SMS consent' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    smsConsent?: boolean;

    @ApiPropertyOptional({ description: 'Has email consent' })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    emailConsent?: boolean;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Sort by field' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'name';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class CreateCustomerDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: Gender })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    postalCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    smsConsent?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    emailConsent?: boolean;
}

export class UpdateCustomerDto extends CreateCustomerDto {}
