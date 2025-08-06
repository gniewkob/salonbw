import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Email address used for login',
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
}
