import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class RegisterDto {
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
}
