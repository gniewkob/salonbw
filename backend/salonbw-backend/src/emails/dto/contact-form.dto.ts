import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactFormDto {
    @ApiProperty({ description: 'Sender name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @ApiProperty({ description: 'Sender email address' })
    @IsEmail()
    @IsNotEmpty()
    replyTo: string;

    @ApiProperty({ description: 'Message body' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;
}
