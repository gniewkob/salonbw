import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    Min,
    Matches,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail()
    email: string;

    @ApiHideProperty()
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    @IsString()
    name: string;

    @ApiProperty({
        required: false,
        description: 'International phone number',
        example: '+123456789',
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'phone must be a valid international number',
    })
    phone?: string;

    @ApiProperty({
        required: false,
        description: 'Commission base for the user',
        example: 0,
    })
    @IsOptional()
    @Min(0)
    commissionBase?: number;

    @ApiProperty({
        required: false,
        description: 'Whether the user receives notifications',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    receiveNotifications?: boolean;
}
