import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { Gender } from '../user.entity';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiProperty({ required: false })
    phone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(120)
    @ApiProperty({ required: false })
    firstName?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(120)
    @ApiProperty({ required: false })
    lastName?: string | null;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ required: false })
    birthDate?: string | null;

    @IsEnum(Gender)
    @IsOptional()
    @ApiProperty({ required: false, enum: Gender })
    gender?: Gender | null;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    @ApiProperty({ required: false })
    address?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(120)
    @ApiProperty({ required: false })
    city?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiProperty({ required: false })
    postalCode?: string | null;
}
