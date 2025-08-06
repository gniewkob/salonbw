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
    @ApiProperty({
        description: 'User email address',
        type: String,
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Account password',
        type: String,
        minLength: 6,
        example: 'Secret123',
    })
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: 'First name of the user',
        type: String,
        example: 'Jan',
    })
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the user',
        type: String,
        example: 'Kowalski',
    })
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'Optional contact phone number',
        type: String,
        required: false,
        example: '+48123123123',
    })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({
        description: 'Whether the user accepted the privacy policy',
        type: Boolean,
        required: false,
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    privacyConsent?: boolean;

    @ApiProperty({
        description: 'Whether the user consents to marketing messages',
        type: Boolean,
        required: false,
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;

    @ApiProperty({
        description: 'Role assigned to the user',
        enum: Role,
        required: false,
        example: Role.Client,
    })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
