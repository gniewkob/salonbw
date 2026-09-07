import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @IsString()
    @MinLength(20)
    @MaxLength(256)
    @ApiProperty({ description: 'One-time token from the reset email' })
    token: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @ApiProperty({ minLength: 8, maxLength: 128 })
    password: string;
}
