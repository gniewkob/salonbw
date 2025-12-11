import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'International phone number',
        example: '+123456789',
        required: false,
    })
    phone?: string;

    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'Commission base for the user',
        example: 0,
        required: false,
    })
    commissionBase?: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        description: 'Whether the user receives notifications',
        example: true,
        required: false,
    })
    receiveNotifications?: boolean;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'Password',
        example: 'password123',
        required: false,
    })
    password?: string;
}
