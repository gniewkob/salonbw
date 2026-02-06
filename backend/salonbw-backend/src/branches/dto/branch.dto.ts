import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsEmail,
    IsUrl,
    IsEnum,
    Length,
    Matches,
    IsObject,
    Min,
    Max,
    IsArray,
} from 'class-validator';
import { BranchStatus } from '../entities/branch.entity';

export class CreateBranchDto {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers and dashes',
    })
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    street?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    buildingNumber?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    apartmentNumber?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}-\d{3}$/, {
        message: 'Postal code must be in format XX-XXX',
    })
    postalCode?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    city?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    country?: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsUrl()
    coverImageUrl?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex color',
    })
    primaryColor?: string;

    @IsOptional()
    @IsObject()
    workingHours?: Record<string, { open: string; close: string } | null>;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @IsOptional()
    @IsString()
    @Length(2, 10)
    locale?: string;

    @IsOptional()
    @IsBoolean()
    onlineBookingEnabled?: boolean;

    @IsOptional()
    @IsString()
    bookingUrl?: string;
}

export class UpdateBranchDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug must contain only lowercase letters, numbers and dashes',
    })
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @Length(0, 255)
    street?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    buildingNumber?: string;

    @IsOptional()
    @IsString()
    @Length(0, 20)
    apartmentNumber?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    city?: string;

    @IsOptional()
    @IsString()
    @Length(0, 100)
    country?: string;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsUrl()
    coverImageUrl?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, {
        message: 'Color must be a valid hex color',
    })
    primaryColor?: string;

    @IsOptional()
    @IsObject()
    workingHours?: Record<string, { open: string; close: string } | null>;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    @Length(3, 3)
    currency?: string;

    @IsOptional()
    @IsString()
    @Length(2, 10)
    locale?: string;

    @IsOptional()
    @IsEnum(BranchStatus)
    status?: BranchStatus;

    @IsOptional()
    @IsBoolean()
    onlineBookingEnabled?: boolean;

    @IsOptional()
    @IsString()
    bookingUrl?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

export class AddBranchMemberDto {
    @IsNumber()
    userId: number;

    @IsOptional()
    @IsString()
    branchRole?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    canManage?: boolean;
}

export class UpdateBranchMemberDto {
    @IsOptional()
    @IsString()
    branchRole?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsBoolean()
    canManage?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class BranchQueryDto {
    @IsOptional()
    @IsEnum(BranchStatus)
    status?: BranchStatus;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsBoolean()
    onlineBookingEnabled?: boolean;

    @IsOptional()
    @IsNumber()
    ownerId?: number;
}
