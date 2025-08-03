import {
    IsEmail,
    IsString,
    IsNotEmpty,
    MinLength,
    Matches,
    IsBoolean,
    IsOptional,
    Equals,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterClientDto {
    @ApiProperty()
    @IsString()
    @MinLength(2)
    firstName: string;

    @ApiProperty()
    @IsString()
    @MinLength(2)
    lastName: string;

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @Matches(/^\+48\d{9}$/)
    phone: string;

    @ApiProperty()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    password: string;

    @ApiProperty()
    @IsBoolean()
    @Equals(true)
    privacyConsent: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
