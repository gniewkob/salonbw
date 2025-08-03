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
import { IsEuPhoneNumber } from '../../common/validators/is-eu-phone-number';

export class RegisterClientDto {
    @ApiProperty({ example: 'Jan' })
    @IsString()
    @MinLength(2)
    firstName: string;

    @ApiProperty({ example: 'Kowalski' })
    @IsString()
    @MinLength(2)
    lastName: string;

    @ApiProperty({ example: 'jan@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '+48123123123' })
    @IsEuPhoneNumber()
    phone: string;

    @ApiProperty({ example: 'Secret123!' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    password: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @Equals(true)
    privacyConsent: boolean;

    @ApiProperty({ required: false, example: false })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
