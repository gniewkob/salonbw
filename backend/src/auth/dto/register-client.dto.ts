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
    @ApiProperty({
        description: 'First name of the client',
        type: String,
        minLength: 2,
        example: 'Jan',
    })
    @IsString()
    @MinLength(2)
    firstName: string;

    @ApiProperty({
        description: 'Last name of the client',
        type: String,
        minLength: 2,
        example: 'Kowalski',
    })
    @IsString()
    @MinLength(2)
    lastName: string;

    @ApiProperty({
        description: 'Client email address',
        type: String,
        example: 'jan@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Contact phone number in EU format',
        type: String,
        example: '+48123123123',
    })
    @IsEuPhoneNumber()
    phone: string;

    @ApiProperty({
        description: 'Account password',
        type: String,
        example: 'Secret123!'
    })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    password: string;

    @ApiProperty({
        description: 'Confirmation of privacy policy acceptance',
        type: Boolean,
        example: true,
    })
    @IsBoolean()
    @Equals(true)
    privacyConsent: boolean;

    @ApiProperty({
        description: 'Marketing consent flag',
        type: Boolean,
        required: false,
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
