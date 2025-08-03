import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsNotEmpty,
    MinLength,
    IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role.enum';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    privacyConsent?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;

    @ApiProperty({ enum: Role, required: false })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
